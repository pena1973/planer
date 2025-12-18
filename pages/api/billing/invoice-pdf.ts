// pages/api/billing/invoice-pdf.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import React from 'react';
import {
    Document as PdfDocument,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
} from '@react-pdf/renderer';

import { ClientItem, MainItem } from "./../../../types/service-types";
import { getClient, getMain, getInvoice } from '@/handlers/handlers-get';

import { ClientTable } from "./../../../db/models/billing/clients";
import { MainTable } from './../../../db/models/billing/main';
import { InvoiceTable } from '@/db/models/billing/invoice';

import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository, } from './../../../db/utilites'
import connectDb from "@/db/database";
import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

// Локальные типы для PDF генерации
type Party = {
    title: string;      // Название/имя
    vat?: string;       // VAT
    country?: string;
    zip?: string;
    city?: string;
    address1?: string;
    address2?: string;
    email?: string;
    phone?: string;
};

type PDFInvoice = {
    invoiceNo: string;
    dateIssue: string;
    dateDue: string;
    seller: Party;
    billTo: Party;
    items: Array<{ name: string; qty: number; unit: number }>;
    currency: 'EUR';
    paid: boolean;
    note?: string; // "Invoice for service usage credit"
};

// стили для  инвойса
const styles = StyleSheet.create({
    page: {
        paddingTop: 36,
        paddingBottom: 36,
        paddingLeft: 44,
        paddingRight: 44,
        fontSize: 10.5,
        lineHeight: 1.35,
    },

    // header
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 18,
    },
    title: { fontSize: 24, fontWeight: 700 },
    sellerTopRight: { fontSize: 18, fontWeight: 600, color: '#555' },

    // invoice meta (left block)
    metaRow: { flexDirection: 'row', marginBottom: 18 },
    metaLeft: { width: '55%' },
    metaLine: { flexDirection: 'row', marginBottom: 2 },
    metaLabel: { width: 88, color: '#000' },
    metaValue: { color: '#000' },

    // seller / bill-to row
    partiesRow: { flexDirection: 'row', marginTop: 10, marginBottom: 22 },
    col: { width: '50%' },
    partyName: { fontWeight: 700, marginBottom: 3 },
    partyText: { color: '#000' },

    // big due line
    dueLine: { fontSize: 16, fontWeight: 700, marginBottom: 10 },

    // description
    desc: { marginBottom: 14, color: '#000' },

    // table
    table: { marginTop: 6 },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1 solid #000',
        paddingBottom: 6,
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 8,
        borderBottom: '1 solid #eee',
    },

    cDesc: { width: '58%' },
    cQty: { width: '12%', textAlign: 'right' },
    cUnit: { width: '15%', textAlign: 'right' },
    cAmt: { width: '15%', textAlign: 'right' },

    th: { fontSize: 9.5, fontWeight: 700 },
    td: { fontSize: 10.5 },

    // totals
    totalsWrap: { marginTop: 10, alignItems: 'flex-end' },
    totalsBox: { width: '42%' },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    totalLabel: { color: '#000' },
    totalValue: { color: '#000' },
    totalBold: { fontWeight: 700 },

    // footer
    thanks: { marginTop: 18, fontSize: 11 },
});

// вспомогательная функция для формирования строк блока продавца/покупателя
function partyLines(p: Party): string[] {
    const lines: string[] = [];

    if (p.title) lines.push(p.title);
    if (p.vat) lines.push(`VAT: ${p.vat}`);

    if (p.address1) lines.push(p.address1);
    if (p.address2) lines.push(p.address2);

    // город + индекс в одну строку, как обычно
    const cityZip = [p.zip, p.city].filter(Boolean).join(' ');
    if (cityZip) lines.push(cityZip);

    if (p.country) lines.push(p.country);

    if (p.phone) lines.push(p.phone);
    if (p.email) lines.push(p.email);

    return lines;
}
// форматирование денег
function money(n: number): string {
    return n.toFixed(2);
}
// получение названия страны по коду и локали
const countryName = (code: string, locale: string) => {
    const c = (code || '').trim().toUpperCase();
    if (!c) return '';

    try {
        const dn = new Intl.DisplayNames([locale], { type: 'region' });
        // dn.of('LV') -> "Latvia" (или "Латвия" при 'ru')
        return dn.of(c) ?? c;
    } catch {
        return c; // fallback если Intl.DisplayNames недоступен
    }
};

// функция построения PDF документа
function buildPdfDoc(inv: PDFInvoice) {
    const subtotal = inv.items.reduce((s, it) => s + it.qty * it.unit, 0);
    const tax = 0; // мок
    const total = subtotal + tax;

    // const dueText = `${money(total)} ${inv.currency} due ${inv.dateDue}`; // мок "due" = date
    const mainLine = inv.paid
        ? `${money(total)} ${inv.currency} paid ${inv.dateIssue}`
        : `${money(total)} ${inv.currency} due ${inv.dateDue}`;

    return React.createElement(
        PdfDocument,
        null,
        React.createElement(
            Page,
            { size: 'A4', style: styles.page },

            // Header: Invoice (left) + Seller name (right)
            React.createElement(
                View,
                { style: styles.headerRow },
                React.createElement(Text, { style: styles.title }, 'Invoice'),
                // React.createElement(Text, { style: styles.sellerTopRight }, inv.seller.title)
            ),

            // Meta lines (left like Stripe)
            React.createElement(
                View,
                { style: styles.metaRow },
                React.createElement(
                    View,
                    { style: styles.metaLeft },
                    React.createElement(
                        View,
                        { style: styles.metaLine },
                        React.createElement(Text, { style: styles.metaLabel }, 'Invoice number'),
                        React.createElement(Text, { style: styles.metaValue }, inv.invoiceNo)
                    ),
                    React.createElement(
                        View,
                        { style: styles.metaLine },
                        React.createElement(Text, { style: styles.metaLabel }, 'Date of issue'),
                        React.createElement(Text, { style: styles.metaValue }, inv.dateIssue)
                    ),
                    React.createElement(
                        View,
                        { style: styles.metaLine },
                        React.createElement(Text, { style: styles.metaLabel }, 'Date due'),
                        React.createElement(Text, { style: styles.metaValue }, inv.dateDue)
                    )
                )
            ),

            // Parties: Seller left, Bill to right

            React.createElement(
                View,
                { style: styles.partiesRow },

                // Seller (left)
                React.createElement(
                    View,
                    { style: styles.col },
                    ...partyLines(inv.seller).map((line, i) =>
                        React.createElement(
                            Text,
                            { key: `s-${i}`, style: i === 0 ? styles.partyName : styles.partyText },
                            line
                        )
                    )
                ),

                // Bill to (right)
                React.createElement(
                    View,
                    { style: styles.col },
                    React.createElement(Text, { style: styles.partyName }, 'Bill to'),
                    ...partyLines(inv.billTo).map((line, i) =>
                        React.createElement(Text, { key: `b-${i}`, style: styles.partyText }, line)
                    )
                )
            ),


            // Big due line
            // React.createElement(Text, { style: styles.dueLine }, dueText),
            React.createElement(Text, { style: styles.dueLine }, mainLine),

            // Description
            React.createElement(Text, { style: styles.desc }, 'Invoice for service usage credit'),

            // Table
            React.createElement(
                View,
                { style: styles.table },
                React.createElement(
                    View,
                    { style: styles.tableHeader },
                    React.createElement(Text, { style: [styles.th, styles.cDesc] }, 'Description'),
                    React.createElement(Text, { style: [styles.th, styles.cQty] }, 'Qty'),
                    React.createElement(Text, { style: [styles.th, styles.cUnit] }, 'Unit price'),
                    React.createElement(Text, { style: [styles.th, styles.cAmt] }, 'Amount')
                ),

                ...inv.items.map((it, idx) => {
                    const sum = it.qty * it.unit;
                    return React.createElement(
                        View,
                        { key: String(idx), style: styles.row },
                        React.createElement(Text, { style: [styles.td, styles.cDesc] }, it.name),
                        React.createElement(Text, { style: [styles.td, styles.cQty] }, String(it.qty)),
                        React.createElement(Text, { style: [styles.td, styles.cUnit] }, `${money(it.unit)} ${inv.currency}`),
                        React.createElement(Text, { style: [styles.td, styles.cAmt] }, `${money(sum)} ${inv.currency}`)
                    );
                })
            ),

            // Totals (right aligned like Stripe)
            React.createElement(
                View,
                { style: styles.totalsWrap },
                React.createElement(
                    View,
                    { style: styles.totalsBox },

                    React.createElement(
                        View,
                        { style: styles.totalLine },
                        React.createElement(Text, { style: styles.totalLabel }, 'Subtotal'),
                        React.createElement(Text, { style: styles.totalValue }, `${money(subtotal)} ${inv.currency}`)
                    ),

                    React.createElement(
                        View,
                        { style: styles.totalLine },
                        React.createElement(Text, { style: styles.totalLabel }, 'Total'),
                        React.createElement(Text, { style: styles.totalValue }, `${money(total)} ${inv.currency}`)
                    ),

                    // React.createElement(
                    //     View,
                    //     { style: styles.totalLine },
                    //     React.createElement(Text, { style: [styles.totalLabel, styles.totalBold] }, 'Amount due'),
                    //     React.createElement(Text, { style: [styles.totalValue, styles.totalBold] }, `${money(total)} ${inv.currency}`)
                    // )
                    React.createElement(
                        View,
                        { style: styles.totalLine },
                        React.createElement(
                            Text,
                            { style: [styles.totalLabel, styles.totalBold] },
                            inv.paid ? 'Paid' : 'Amount due'
                        ),
                        React.createElement(
                            Text,
                            { style: [styles.totalValue, styles.totalBold] },
                            `${money(total)} ${inv.currency}`
                        )
                    )

                )
            ),

            // Footer
            // React.createElement(Text, { style: styles.thanks }, 'Thanks for payment!')
            inv.paid
                ? React.createElement(Text, { style: styles.thanks }, 'Thanks for payment!')
                : null
        )
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = await connectDb();
        const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);
        const mainRepository = getTypedRepository(db, 'MainTable', MainTable);
        const invoicesRepository = getTypedRepository(db, 'InvoiceTable', InvoiceTable);
        const locale = getLocaleFromHeader(req.headers["x-lang"]);

        const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

        if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

        const { userId, teamId, invoiceId } = req.query
        // получаем  данные инвойса клиента
        const invoiceData: InvoiceTable | null = await getInvoice(Number(userId), locale, Number(teamId), Number(invoiceId), invoicesRepository);

        if (!invoiceData) {
            // отправляем ответ
            return res.status(200).json({
                success: false,
                message: "Данные инвойсане найдены",
            });
        }

        const invoiceDate = invoiceData?.paid_at || new Date().toISOString().slice(0, 10);

        // получаем  данные клиента
        const client: ClientItem | undefined = await getClient(Number(userId), locale, Number(teamId), clientRepository);
        if (!client) {
            // отправляем ответ
            return res.status(200).json({
                success: false,
                message: "Данные клиента не найдены",
            });
        }


        // получаем  данные селлера (свои реквизиты)
        const seller: MainItem | undefined = await getMain(Number(userId), locale, mainRepository, invoiceDate);

        if (!seller) {
            // отправляем ответ
            return res.status(200).json({
                success: false,
                message: "Данные продавца не найдены",
            });
        }

        const inv: PDFInvoice = {
            invoiceNo: invoiceData.stripe_invoice_number || 'N/A',
            dateIssue: invoiceData.created_at.toISOString().slice(0, 10),
            dateDue: invoiceData.paid_at?.toISOString().slice(0, 10) || "",
            currency: String(invoiceData.currency) as 'EUR',
            paid: invoiceData.status === 'paid',
            note: 'Invoice for service usage credit',

            seller: {
                title: seller.title,
                vat: seller.reg_n || '',
                country: countryName(seller.country || '', "en"),
                zip: seller.postal_code || '',
                city: seller.city || '',
                address1: seller.address_line1 || '',
                address2: seller.address_line2 || '',
                email: seller.email || '',
                phone: seller.phone || '',
            },

            billTo: {
                title: client.title,
                vat: client.reg_n || '',
                country: countryName(client.country || '', "en"),
                zip: client.postal_code || '',
                city: client.city || '',
                address1: client.address_line1 || '',
                address2: client.address_line2 || '',
                email: client.email || '',
                phone: client.phone || '',
            },

            items: [{ name: 'Service usage credit', qty: Number(invoiceData.amount_total) / 100, unit: Number(invoiceData.amount_total) / 100 }], // сумма в центах
        };

        const doc = buildPdfDoc(inv);
        const buf = await pdf(doc).toBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${inv.invoiceNo}.pdf"`);
        res.status(200).send(buf);

    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) {
            error = e.message;
        }
        //  logger
        void ulogger.error({
            userId: null,
            location: "pages/api/billing/invoice-api",
            event: "api_error",
            message: `catch: ${error}`,
            context: "",
        }).catch(() => { console.error("logger error") });
        res.status(500).json({ error: `${error}` });
    }
}
