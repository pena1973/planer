// pages/api/payments/create-checkout.ts
export const config = { runtime: 'nodejs' };
import { getClient } from '@/handlers/handlers-get';
import { getTypedRepository, } from './../../../db/utilites'
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDb from "@/db/database";
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { ClientTable } from "./../../../db/models/billing/clients";
import { ClientItem } from './../../../types/service-types'
import { randomUUID } from 'crypto';

import { stripe } from './../../../lib/common/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const db = await connectDb();
    const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    const { amount, userId, teamId } = req.body as {
      amount: number; userId: number; teamId: number; customerId?: string;
    };

    if (!amount || amount <= 0) return res.status(400).send('Invalid amount');
    if (!userId) return res.status(400).send('Missing userId');
    if (!teamId) return res.status(400).send('Missing teamId');

    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 100 || amountInCents > 100_000_00) {
      return res.status(400).send('Amount out of allowed range');
    }

    const baseUrl = process.env.APP_BASE_URL;
    if (!baseUrl) return res.status(500).send('APP_BASE_URL is not set');

    const client: ClientItem | undefined = await getClient(Number(userId), locale, teamId, clientRepository);
    if (!client) {
      // отправляем ответ
      return res.status(200).json({
        success: false,
        message: "Данные клиента не найдены",
      });
    }

    const metadata = {
      userId: String(userId),
      teamId: String(teamId),
      amountInCents: String(amountInCents),
      purpose: 'balance_topup',
      locale: locale,
    };

    // определяем customer: либо из тела запроса, либо создаём
    const customerId = client.customerId;

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      currency: 'eur',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountInCents,
            tax_behavior: 'exclusive', // налог отдельной строкой
            product_data: {
              name: 'Balance top-up',
              description: `Пополнение баланса команды #${teamId} (инициатор #${userId})`,
            },
          },
          quantity: 1,
        },
      ],

      automatic_tax: { enabled: true },
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },

      metadata,

      // 👇 правильная логика
      ...(customerId
        ? { customer: customerId, customer_update: { address: 'auto', name: 'auto' } }
        : client?.email
          ? { customer_email: client.email }
          : {}),

      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Invoice for balance top-up`,
          metadata,
        },
      },

      success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payments/cancel`,
    };

    const session = await stripe.checkout.sessions.create(
      params,

      { idempotencyKey: `topup:${userId}:${teamId}:${amountInCents}:${randomUUID()}` }

    );

    if (!session.url) return res.status(500).send('Failed to get Checkout URL');
    return res.status(200).json({ redirectUrl: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).send('Failed to create checkout session');
  }
}
