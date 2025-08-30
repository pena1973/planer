// pages/api/payments/create-checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  try {

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { amount, userId } = req.body as { amount: number; userId: number, teamId: number };
    if (!amount || amount <= 0) return res.status(400).send('Invalid amount');
    if (!userId) return res.status(400).send('Missing userId');

    // Работает с центами
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 100 || amountInCents > 1_000_000_00) {
      return res.status(400).send('Amount out of allowed range');
    }

    const baseUrl = process.env.APP_BASE_URL!;
    // Сессия требует success_url и cancel_url, Stripe вернёт session.url для редиректа
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        currency: 'eur',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Balance top-up',
                description: `Пополнение баланса пользователя #${userId}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing/cancel`,
        // Важно: прокидываем метаданные для вебхука
        metadata: {
          userId: String(userId),
          teamId: String(req.body.teamId),
          amountInCents: String(amountInCents),
          purpose: 'balance_topup',
        },
      },
      // опционально защитимся от повторов
      { idempotencyKey: `topup:${userId}:${amountInCents}:${Date.now()}` }
    );

    return res.status(200).json({ redirectUrl: session.url! });
  } catch (err: any) {
    console.error('create-checkout error', err);
    return res.status(500).send('Failed to create checkout session');
  }
}
