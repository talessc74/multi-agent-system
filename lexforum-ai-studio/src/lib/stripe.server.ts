import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'brl',
  metadata: Record<string, string> = {}
) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });
};

export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string
) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
};
