// pages/api/payments/webhook.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';

import connectDb from '@/db/database';
import { getTypedRepository } from '@/db/utilites';
import { InvoiceTable } from '@/db/models/billing/invoice';
import { BalanceTable } from '@/db/models/billing/balance';
import { updateBalance } from '@/handlers/handlers-update';

export const config = { api: { bodyParser: false } };

import { stripe } from './../../../lib/common/stripe';

// безопасный геттер чисел
const num = (v: unknown, def = 0): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : def;

/**
 * Сохранить инвойс (идемпотентно) и, если это первая вставка + статус paid,
 * начислить баланс команде (net = subtotal/100).
 * Возвращает true, если баланс был начислен.
 */
async function upsertInvoiceAndCredit(
    invoice: Stripe.Invoice,
    opts?: { sessionMeta?: Stripe.Checkout.Session['metadata']; paymentIntentId?: string | null }
): Promise<boolean> {
    const db = await connectDb();
    const invoiceRepo = getTypedRepository(db, 'InvoiceTable', InvoiceTable);
    const balanceRepo = getTypedRepository(db, 'BalanceTable', BalanceTable);

    // суммы (в центах)
    const subtotal = num(invoice.subtotal, 0); // без НДС (net)
    const total = num(invoice.total, 0);       // с НДС (gross)
    const tax = Math.max(0, total - subtotal);

    // team_id из метаданных (передай его при создании Checkout Session в metadata.teamId)
    const teamIdMeta =
        (invoice.metadata?.teamId as string | undefined) ??
        (opts?.sessionMeta?.teamId as string | undefined);
    const team_id = teamIdMeta ? Number(teamIdMeta) : 0;

    // paid_at
    const paidAtSec = invoice.status_transitions?.paid_at;
    const paid_at = paidAtSec ? new Date(paidAtSec * 1000) : null;

    // идемпотентность — ищем по stripe_invoice_id
    const existing = await invoiceRepo.findOne({ where: { stripe_invoice_id: invoice.id } });
    if (existing) {
        // освежим данные (если что-то досчиталось позже)
        existing.status = invoice.status ?? existing.status;
        existing.currency = invoice.currency ?? existing.currency;
        existing.amount_subtotal = String(subtotal);
        existing.amount_total = String(total);
        existing.tax_amount = String(tax);
        existing.stripe_invoice_number = invoice.number ?? existing.stripe_invoice_number;
        existing.hosted_invoice_url = invoice.hosted_invoice_url ?? existing.hosted_invoice_url;
        // в новых версиях поле называется invoice_pdf и это строка-ссылка
        existing.invoice_pdf_url = (invoice.invoice_pdf as string | null) ?? existing.invoice_pdf_url;
        existing.customer_email = invoice.customer_email ?? existing.customer_email ?? null;
        existing.customer_country = invoice.customer_address?.country ?? existing.customer_country ?? null;
        existing.customer_vat_id =
            invoice.customer_tax_ids && invoice.customer_tax_ids.length > 0
                ? invoice.customer_tax_ids[0].value
                : existing.customer_vat_id;
        if (!existing.paid_at && paid_at) existing.paid_at = paid_at;

        await invoiceRepo.save(existing);
        return false; // уже был — баланс не трогаем
    }

    // новая запись
    const row = invoiceRepo.create({
        stripe_invoice_id: invoice.id,
        stripe_invoice_number: invoice.number ?? null,
        stripe_customer_id:
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,

        team_id,
        status: invoice.status || 'paid',
        currency: invoice.currency,

        amount_subtotal: String(subtotal),
        tax_amount: String(tax),
        amount_total: String(total),

        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf_url: (invoice.invoice_pdf as string | null) ?? null,

        customer_email: invoice.customer_email ?? null,
        customer_country: invoice.customer_address?.country ?? null,
        customer_vat_id:
            invoice.customer_tax_ids && invoice.customer_tax_ids.length > 0
                ? invoice.customer_tax_ids[0].value
                : null,

        paid_at,
    });
    await invoiceRepo.save(row);

    // Начисляем баланс ТОЛЬКО при первичной вставке и только для оплаченого инвойса
    if (team_id && invoice.status === 'paid') {
        // если нужно кредитовать gross — поменяй subtotal -> total
        const amountEUR = subtotal / 100;
        const todayISO = new Date().toLocaleDateString('en-CA');

        const externalId = (opts?.paymentIntentId ?? invoice.id) as string;

        const balanceRes = await updateBalance(
            balanceRepo,
            team_id,
            externalId,
            amountEUR,
            todayISO,
            false,
            `Stripe top-up ${todayISO}`,
            '+',
            'Stripe invoice top-up'
        );

        if (!balanceRes.success) {
            console.warn(`Баланс НЕ пополнен, team_id=${team_id}`);
            return false;
        }
        console.log(`✅ Баланс пополнен: team_id=${team_id}, amount=${amountEUR}`);
        return true;
    }

    return false;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    } catch (e: unknown) {
        let message = 'Webhook signature verification failed';
        if (e instanceof Error) {
            message = `Webhook Error: ${e?.message || 'Signature invalid'}`;
        }
        console.error(message);
        return res.status(400).send(message);
    }

    try {
        switch (event.type) {
            case 'invoice.payment_succeeded': {
                // надёжный триггер: инвойс оплачен и финализирован
                const inv = event.data.object as Stripe.Invoice;
                await upsertInvoiceAndCredit(inv);
                break;
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                // session.invoice: string | { id: string } | null
                const invoiceId =
                    typeof session.invoice === 'string'
                        ? session.invoice
                        : session.invoice?.id;

                if (!invoiceId) {
                    console.warn('checkout.session.completed: no invoice attached to session');
                } else {
                    // <-- здесь invoiceId гарантированно string
                    const invoice: Stripe.Invoice = await stripe.invoices.retrieve(invoiceId);

                    const paymentIntentId =
                        typeof session.payment_intent === 'string'
                            ? session.payment_intent
                            : session.payment_intent?.id ?? null;

                    await upsertInvoiceAndCredit(invoice, {
                        sessionMeta: session.metadata,
                        paymentIntentId,
                    });
                }
                break;
            }
            case 'invoice_payment.paid': {

            }

            default:
                // другие события не используем
                break;
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook handler error', err);
        return res.status(500).send('Webhook handler error');
    }
}
