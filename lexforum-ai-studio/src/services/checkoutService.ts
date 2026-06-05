import type { User } from 'firebase/auth';

export async function initiateCheckout(
  user: User,
  simulationId: string,
  mode: number
): Promise<string | null> {
  const token = await user.getIdToken();
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ simulationId, mode }),
  });
  const data = await response.json();
  return data.url ?? null;
}
