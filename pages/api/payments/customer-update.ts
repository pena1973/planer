import Stripe from 'stripe';
import { stripe } from '@/lib/common/stripe';
import { ClientItem } from './../../../types/service-types';

function buildAddress(client?: ClientItem): Stripe.AddressParam | undefined {
    if (
        !client?.address_line1 &&
        !client?.address_line2 &&
        !client?.city &&
        !client?.postal_code &&
        !client?.country
    ) {
        return undefined;
    }
    return {
        line1: client.address_line1 || undefined,
        line2: client.address_line2 || undefined,
        city: client.city || undefined,
        postal_code: client.postal_code || undefined,
        country: client.country || undefined, // ISO-2
    };
}

export default async function updateStripeCustomerFromClient(
    client?: ClientItem
): Promise<string | undefined> {
    if (!client || (!client.email && !client.title)) return undefined;

    const address = buildAddress(client);

    // shipping передаём только если есть адрес (иначе тип ругается)
    const shipping: Stripe.CustomerUpdateParams.Shipping | undefined = address
        ? {
            name: client.title || "",
            phone: client.phone || undefined,
            address, // здесь точно не undefined
        }
        : undefined;

    const params: Stripe.CustomerUpdateParams = {
        name: client.title || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        description: 'Planer',
        metadata: {
            teamId: String(client.teamId ?? ''),
            ...(client.teamId ? { clientId: String(client.teamId) } : {}),
        },
        address,
        ...(shipping ? { shipping } : {}), // прокинем только если есть

        invoice_settings: {
            ...(client.reg_n ? { custom_fields: [{ name: 'VAT', value: client.reg_n }] } : {}),
            footer: 'Thanks for payment!',
        },

        tax_exempt: 'none',
    };

    let customerId = client.customerId ?? undefined;

    if (customerId) {
        await stripe.customers.update(customerId, params);
    } else {
        const created = await stripe.customers.create(
            params as Stripe.CustomerCreateParams
        );
        customerId = created.id;
    }

    if (client.reg_n && customerId) {
        try {
            await stripe.customers.createTaxId(customerId, {
                type: 'eu_vat',
                value: client.reg_n,
            });
        } catch (e) {
            console.warn('createTaxId failed (maybe exists):', e);
        }
    }

    return customerId;
}
