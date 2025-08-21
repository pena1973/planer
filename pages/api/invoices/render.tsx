import type { NextApiRequest, NextApiResponse } from 'next';
import { pdf, Font } from '@react-pdf/renderer';
import path from 'node:path';
import React from 'react';
import { z } from 'zod';

import InvoiceDocument, { type Invoice as InvoicePDF } from '@/components/pdf/InvoiceDocument';

// === DB & Entities (проверь пути импортов под твой проект) ===
import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites';
import { BillTable } from './../../../db/models/billing/bills'; 
import { BillRowTable } from '@/db/models/billing/bill_row';  
import { ClientTable } from '@/db/models/billing/clients';   

// === Шрифты (кириллица) ===
const fontRegular = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
const fontBold = path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf');
Font.register({
  family: 'Inter',
  fonts: [
    { src: fontRegular, fontWeight: 'normal' },
    { src: fontBold, fontWeight: 'bold' },
  ],
});

// === Валидируем вход ===
// Вариант 1: сервер сам собирает invoice по billId из БД
const ZParty = z.object({ name: z.string(), address: z.string(), vat: z.string().optional() });
const ZFromDb = z.object({
  billId: z.number().int().positive(),
  teamId: z.number().int().positive(),
  buyer: ZParty.optional(), // override покупателя, если хочешь
});
// Вариант 2: уже готовый invoice (если когда-то захочешь отправлять целиком)
const ZItem = z.object({ id: z.string(), title: z.string(), qty: z.number(), price: z.number() });
const ZInvoice = z.object({
  id: z.string(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  seller: ZParty,
  buyer: ZParty,
  currency: z.string(),
  items: z.array(ZItem).min(1),
  notes: z.string().optional(),
});
const ZPayload = z.union([
  z.object({ invoice: ZInvoice }),
  ZFromDb,
]);

// === Вспомогалки ===
function sellerFromEnv(): { name: string; address: string; vat?: string } {
  const name = process.env.SELLER_NAME ?? 'Seller';
  const address = process.env.SELLER_ADDRESS ?? '';
  const vat = process.env.SELLER_VAT_NUMBER ?? undefined;
  return { name, address, vat };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('ru-RU');
}

function toNumberSafe(s: unknown, fallback = 0): number {
  if (typeof s === 'number') return s;
  if (typeof s === 'string') {
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function buildInvoiceFromDb(billId: number, teamId: number, buyerOverride?: { name: string; address: string; vat?: string }): Promise<InvoicePDF> {
  const db = await connectDb();

  const billsRepo = getTypedRepository( db, 'BillTable',BillTable);  
  const rowsRepo = getTypedRepository(db, 'BillRowTable',BillRowTable);

  // const clientsRepo = getTypedRepository(ClientTable, db); // если появится ссылка client_id — дотянем отсюда

  const bill = await billsRepo.findOneBy({ id: billId, team_id: teamId });
  if (!bill) {
    throw new Error('NOT_FOUND');
  }

  const rows = await rowsRepo.findBy({ bill: billId, team_id: teamId });
  if (!rows?.length) {
    throw new Error('NO_ROWS');
  }

  // Проверим валюту: в твоей схеме у строк есть carency (typo), возьмём из первой
  const currency = rows[0]?.carency || 'EUR';
  for (const r of rows) {
    if (r.carency !== currency) {
      throw new Error('MULTI_CURRENCY'); // разные валюты в одном счёте — не поддерживаем
    }
  }

  // Покупатель: если нет связки в БД — используем override или «заглушку»
  const buyer = buyerOverride ?? { name: 'Клиент', address: '' };

  // Каждая строка = одна услуга за период (qty=1), price = amount * (1 - discount%)
  const items = rows.map((r, i) => {
    const amount = toNumberSafe(r.amount, 0);
    const disc = toNumberSafe(r.discaunt, 0); // r.discaunt — varchar процента
    const price = round2(amount * (1 - disc / 100));
    const title = `Услуги ${fmtDate(r.date_from)}–${fmtDate(r.date_to)} (команда ${r.billable_team_id})`;
    return {
      id: String(r.id ?? i + 1),
      title,
      qty: 1,
      price,
    };
  });

  const invoice: InvoicePDF = {
    id: `INV-${bill.id}`,
    issueDate: new Date(bill.date).toISOString(),
    // dueDate: можно добавить +14 дней, если нужно:
    // dueDate: new Date(new Date(bill.date).getTime() + 14*24*3600*1000).toISOString(),
    seller: sellerFromEnv(),
    buyer,
    currency,
    items,
    notes: bill.coment || undefined,
  };

  return invoice;
}

// === Handler ===
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const parsed = ZPayload.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    let invoice: InvoicePDF;

    if ('invoice' in parsed.data) {
      // уже готовые данные (редкий кейс)
      invoice = parsed.data.invoice;
    } else {
      // основной путь: собираем из БД
      const { billId, teamId, buyer } = parsed.data;
      invoice = await buildInvoiceFromDb(billId, teamId, buyer);
    }

    // Генерация PDF
    const instance = pdf(<InvoiceDocument invoice={invoice} />);
    const buffer = await instance.toBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (e: any) {
    if (e?.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Bill not found' });
    }
    if (e?.message === 'NO_ROWS') {
      return res.status(400).json({ error: 'No bill rows' });
    }
    if (e?.message === 'MULTI_CURRENCY') {
      return res.status(400).json({ error: 'Multiple currencies in one bill are not supported' });
    }
    console.error('PDF render error:', e);
    return res.status(500).json({ error: 'Failed to render PDF' });
  }
}
