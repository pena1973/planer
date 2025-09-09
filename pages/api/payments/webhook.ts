// pages/api/payments/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { updateBalance } from './../../../handlers/handlers-update';
// ваши импорты БД
import connectDb from '@/db/database';
import { getTypedRepository } from '@/db/utilites';
import { BalanceTable } from '@/db/models/billing/balance';

// gross -> net, если VAT включён в цене
function netFromGrossCents(grossCents: number, vatPercent: number) {
    if (!Number.isFinite(grossCents) || grossCents <= 0) return { netCents: 0, vatCents: 0 };
    const vat = Math.max(0, Math.min(100, Number(vatPercent) || 0)); // clamp 0..100
    if (vat === 0) return { netCents: Math.round(grossCents), vatCents: 0 };

    const vatBps = Math.round(vat * 100); // 21% -> 2100 б.п.
    const netCents = Math.round(grossCents * 10000 / (10000 + vatBps)); // округление до центов
    const vatCents = grossCents - netCents;
    return { netCents, vatCents };
}

export const config = {
    api: { bodyParser: false }, // для проверки подписи нужен сырой body
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    } catch (err: unknown) {
        const message = 'Webhook signature verification failed';

        if (err instanceof Error) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        } else {
            console.error('Webhook signature verification failed:', err);
            return res.status(400).send(message);
        }
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                // В режиме one-time оплаты успешное списание означает "paid"
                if (session.payment_status === 'paid') {
                    const meta = session.metadata || {};
                    const userId = Number(meta.userId);
                    const teamId = Number(meta.teamId);
                    const vat = Number(meta.vat);
                    const amountInCents = Number(meta.amountInCents);

                    // считаем чистое тело (без НДС)
                    const { netCents, vatCents } = netFromGrossCents(amountInCents, vat);
                    const amount = netCents / 100; // <-- это начисляем в баланс
                    // (при желании можно сохранить и сумму НДС: vatAmount = vatCents / 100)

                    if (!userId || !amountInCents) break; // защита

                    // Начисляем баланс в БД
                    const db = await connectDb();
                    const balanceRepository = getTypedRepository(db, "BalanceTable", BalanceTable);
                    // const amount = amountInCents / 100;
                    // проводка пополнения баланса
                    const balanceRes = await updateBalance(
                        balanceRepository,
                        teamId,
                        session.payment_intent as string,
                        amount,
                        new Date().toLocaleDateString('en-CA'),
                        false,
                        'pay - ' + new Date().toLocaleDateString('en-CA'), // реальный момент платежа по времени сервера
                        "+",
                        "Srtipe top-up")
                    if (!balanceRes.success) {
                        console.log("баланс не пополнен, teamId:" + teamId);
                    } else console.log("баланс пополнен, teamId: " + teamId + ", amount: " + amount);

                }
                break;
            }

            // опционально: обработка возвратов

            case 'charge.updated':
            case 'charge.refunded':
            case 'refund.created':
                // здесь можно уменьшить баланс и записать событие
                break;

            default:
                // другие события нам не критичны
                break;
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook handler error', err);
        return res.status(500).send('Webhook handler error');
    }
}
