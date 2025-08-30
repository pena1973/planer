// pages/api/payments/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { updateBalance } from './../../../handlers/handlers-update';
// ваши импорты БД
import connectDb from '@/db/database';
import { getTypedRepository } from '@/db/utilites';
import { BalanceTable } from '@/db/models/billing/balance';

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
    } catch (err: any) {
        console.error('Webhook signature verification failed', err?.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
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
                    const amountInCents = Number(meta.amountInCents);

                    if (!userId || !amountInCents) break; // защита

                    // Начисляем баланс в БД
                    const db = await connectDb();
                    const balanceRepository = getTypedRepository(db, "BalanceTable", BalanceTable);
                    const amount = amountInCents / 100;
                    // проводка пополнения баланса
                    const balanceRes = await updateBalance(
                        balanceRepository,
                        teamId,
                        amount,
                        new Date().toLocaleDateString('en-CA'),
                        false,
                        'pay - ' + new Date().toLocaleDateString('en-CA'),
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
