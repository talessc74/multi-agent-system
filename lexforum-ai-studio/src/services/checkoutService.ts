import type { User } from 'firebase/auth';

export async function initiateCheckout(
  user: User,
  simulationId: string,
  mode: number,
  options?: { promoCode?: string; returnPath?: string }
): Promise<string | null> {
  const token = await user.getIdToken();
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      simulationId,
      mode,
      ...(options?.promoCode ? { promoCode: options.promoCode } : {}),
      ...(options?.returnPath ? { returnPath: options.returnPath } : {}),
    }),
  });
  const data = await response.json();
  return data.url ?? null;
}
