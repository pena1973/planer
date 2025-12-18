
// pages/api/payments/webhook.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites';
import { InvoiceTable } from './../../../db/models/billing/invoice';
import { BalanceTable } from './../../../db/models/billing/balance';
import { updateBalance } from './../../../handlers/handlers-update';
import { stripe } from './../../../lib/common/stripe';

export const config = { api: { bodyParser: false } };

// safe number
const num = (v: unknown, def = 0): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : def;

const isPaidInvoice = (invoice: Stripe.Invoice) =>
    invoice.status === 'paid' || !!invoice.status_transitions?.paid_at;


/**
 * Сохранить инвойс (идемпотентно) и, если это первая вставка + paid,
 * начислить баланс команде (net = subtotal/100).
 *
 * + сохраняем две ссылки:
 * - hosted_invoice_url / invoice_pdf_url (страничка и прямой PDF из Stripe)
 
 */
async function upsertInvoiceAndCredit(invoice: Stripe.Invoice): Promise<boolean> {

    const db = await connectDb();


    const invoiceRepo = getTypedRepository(db, 'InvoiceTable', InvoiceTable);
    const balanceRepo = getTypedRepository(db, 'BalanceTable', BalanceTable);

    const subtotal = num(invoice.subtotal, 0); // net (cents)
    const total = num(invoice.total, 0);       // gross (cents)
    const tax = Math.max(0, total - subtotal);

    // meta — invoice.paid самодостаточен
    const teamIdMeta = invoice.metadata?.teamId as string | undefined;
    const userIdMeta = invoice.metadata?.userId as string | undefined;
    const localeMeta = invoice.metadata?.locale as string | undefined;

    const team_id = teamIdMeta ? Number(teamIdMeta) : 0;
    const user_id = userIdMeta ? Number(userIdMeta) : 0;
    const locale = localeMeta || 'en';

    // paid_at
    const paidAtSec = invoice.status_transitions?.paid_at;
    const paid_at = paidAtSec ? new Date(paidAtSec * 1000) : null;

    // идемпотентность по stripe_invoice_id
    const existingInv = await invoiceRepo.findOne({ where: { stripe_invoice_id: invoice.id } });

    if (existingInv) {
        existingInv.status = invoice.status ?? existingInv.status;
        existingInv.currency = invoice.currency ?? existingInv.currency;
        existingInv.amount_subtotal = String(subtotal);
        existingInv.amount_total = String(total);
        existingInv.tax_amount = String(tax);

        existingInv.stripe_invoice_number = invoice.number ?? existingInv.stripe_invoice_number;
        existingInv.hosted_invoice_url = invoice.hosted_invoice_url ?? existingInv.hosted_invoice_url;        
        existingInv.customer_email = invoice.customer_email ?? existingInv.customer_email ?? null;
        existingInv.customer_country = invoice.customer_address?.country ?? existingInv.customer_country ?? null;
        existingInv.customer_vat_id =
            invoice.customer_tax_ids && invoice.customer_tax_ids.length > 0
                ? invoice.customer_tax_ids[0].value
                : existingInv.customer_vat_id;

        if (!existingInv.paid_at && paid_at) existingInv.paid_at = paid_at;

        await invoiceRepo.save(existingInv);


    } else {
        // новая запись
        const row = invoiceRepo.create({
            stripe_invoice_id: invoice.id,
            stripe_invoice_number: invoice.number ?? null,
            stripe_customer_id:
                typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,

            team_id,
            status: invoice.status ?? 'unknown',
            currency: invoice.currency,

            amount_subtotal: String(subtotal),
            tax_amount: String(tax),
            amount_total: String(total),

            hosted_invoice_url: invoice.hosted_invoice_url ?? null,

            customer_email: invoice.customer_email ?? null,
            customer_country: invoice.customer_address?.country ?? null,
            customer_vat_id:
                invoice.customer_tax_ids && invoice.customer_tax_ids.length > 0
                    ? invoice.customer_tax_ids[0].value
                    : null,

            paid_at,
        });

        await invoiceRepo.save(row);
    }

    // начисляем баланс только для paid invoice
    if (team_id && isPaidInvoice(invoice)) {
        const amountEUR = subtotal / 100;

        const dt = paid_at ?? new Date();
        const dateISO = dt.toISOString().slice(0, 10); // 'YYYY-MM-DD'


        const transactionId = `stripe:invoice:${invoice.id}`;
        // внутри проверяется по id инвойса  есшли уже был — обновляем поля кроме суммы
        const balanceRes = await updateBalance(
            user_id,
            locale,
            balanceRepo,
            team_id,
            transactionId,
            amountEUR,
            dateISO,
            false,
            `Stripe top-up ${dateISO}`,
            '+',
            'Stripe invoice top-up'
        );

        return !!balanceRes.success;
    }

    return false;
}
async function upsertPaymentIntentAndCredit(pi: Stripe.PaymentIntent): Promise<boolean> {
  const db = await connectDb();
  const balanceRepo = getTypedRepository(db, 'BalanceTable', BalanceTable);

  // 1) защита по статусу
  if (pi.status !== 'succeeded') return false;

  // 2) сумма (cents): лучше amount_received, иначе amount
  const amountCents = num(pi.amount_received, 0) || num(pi.amount, 0);
  if (!amountCents) return false;

  // 3) meta: сначала из PI
  let teamIdMeta = pi.metadata?.teamId as string | undefined;
  let userIdMeta = pi.metadata?.userId as string | undefined;
  let localeMeta = pi.metadata?.locale as string | undefined;

  // 4) fallback: попробуем вытащить Checkout Session по payment_intent
  if (!teamIdMeta || !userIdMeta) {
    try {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
      const s = sessions.data?.[0];
      if (s) {
        teamIdMeta = teamIdMeta ?? (s.metadata?.teamId as string | undefined);
        userIdMeta = userIdMeta ?? (s.metadata?.userId as string | undefined);
        localeMeta = localeMeta ?? (s.metadata?.locale as string | undefined);
      }
    } catch (e) {
      console.warn('[pi] cannot load checkout session for PI', pi.id, e);
    }
  }

  const team_id = teamIdMeta ? Number(teamIdMeta) : 0;
  const user_id = userIdMeta ? Number(userIdMeta) : 0;
  const locale = localeMeta || 'en';

  if (!team_id) {
    console.warn('[pi] missing teamId in metadata, skip', pi.id);
    return false;
  }

  // 5) валюта (если ты строго в EUR)
  const currency = (pi.currency || '').toLowerCase();
  if (currency && currency !== 'eur') {
    console.warn('[pi] non-EUR currency, skip', { id: pi.id, currency });
    return false;
  }

  // 6) дата
  const dt = pi.created ? new Date(pi.created * 1000) : new Date();
  const dateISO = dt.toISOString().slice(0, 10);

  // 7) идемпотентность: transactionId по PI
  const transactionId = `stripe:pi:${pi.id}`;
  const amountEUR = amountCents / 100;

  const balanceRes = await updateBalance(
    user_id,
    locale,
    balanceRepo,
    team_id,
    transactionId,
    amountEUR,
    dateISO,
    false,
    `Stripe top-up ${dateISO}`,
    '+',
    'Stripe payment_intent top-up'
  );

  return !!balanceRes.success;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
        return res.status(400).send('Missing Stripe-Signature');
    }

    let event: Stripe.Event;

    try {
        const buf = await buffer(req);

        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return res.status(500).send('STRIPE_WEBHOOK_SECRET is not set');
        event = stripe.webhooks.constructEvent(buf, sig, secret);

    } catch (e: unknown) {
        const message =
            e instanceof Error ? `Webhook Error: ${e.message || 'Signature invalid'}` : 'Webhook signature verification failed';
        console.error(message);
        return res.status(400).send(message);
    }

    try {
        switch (event.type) {
            case 'invoice.paid': {
                const invLite = event.data.object as Stripe.Invoice;
                if (!invLite.id) break;

                // берём полный invoice (pdf/url/номер/metadata)
                const inv = await stripe.invoices.retrieve(invLite.id);

                // дополнительная защита
                if (!isPaidInvoice(inv)) {
                    console.warn('invoice.paid received but invoice not paid by data, skip', inv.id);
                    break;
                }

                // 2) upsert + начисление
                await upsertInvoiceAndCredit(inv);

                break;
            }
            // case 'payment_intent.succeeded': {

            //     const piLite = event.data.object as Stripe.PaymentIntent;
            //     if (!piLite?.id) break;

            //     // берём полный PI (на всякий)
            //     const pi = await stripe.paymentIntents.retrieve(piLite.id);

            //     // защита: статус должен быть succeeded
            //     if (pi.status !== 'succeeded') {
            //         console.warn('payment_intent.succeeded received but PI not succeeded by data, skip', pi.id, pi.status);
            //         break;
            //     }

            //     await upsertPaymentIntentAndCredit(pi);
                                

            //     break;
            // }
            default:
                break;
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook handler error', err);
        return res.status(500).send('Webhook handler error');
    }
}


