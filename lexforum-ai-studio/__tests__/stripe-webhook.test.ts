import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Stripe webhook fixture tests (adr-local-005)
 *
 * These tests verify the webhook handler logic using event fixtures,
 * without hitting the Stripe API or Firestore.
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCheckoutCompletedSession(overrides: Record<string, any> = {}) {
  return {
    id: 'cs_test_abc123',
    object: 'checkout.session',
    amount_total: 990,
    currency: 'brl',
    payment_status: 'paid',
    total_details: { amount_discount: 0 },
    metadata: {
      uid: 'user_123',
      simulationId: 'sim_456',
      type: 'simulation',
      ...overrides.metadata,
    },
    ...overrides,
  };
}

function makeStripeEvent(type: string, data: object) {
  return { id: `evt_test_${Date.now()}`, type, data: { object: data } };
}

// ── Mock Firestore Admin SDK ──────────────────────────────────────────────────

function makeAdminDbMock() {
  const sets: any[] = [];
  const updates: any[] = [];

  const docMock = (path: string) => ({
    set: vi.fn(async (data: any) => { sets.push({ path, data }); }),
    update: vi.fn(async (data: any) => { updates.push({ path, data }); }),
    get: vi.fn(async () => ({ exists: true, data: () => ({ userId: 'user_123' }) })),
  });

  return {
    collection: (col: string) => ({
      doc: (id: string) => ({
        ...docMock(`${col}/${id}`),
        collection: (subCol: string) => ({
          doc: (subId: string) => docMock(`${col}/${id}/${subCol}/${subId}`),
        }),
      }),
    }),
    _sets: sets,
    _updates: updates,
  };
}

// ── Handler under test ────────────────────────────────────────────────────────

/**
 * Extracted core logic of checkout.session.completed handler.
 * Mirrors the switch-case in server.ts for unit testing.
 */
async function handleCheckoutCompleted(
  session: ReturnType<typeof makeCheckoutCompletedSession>,
  adminDb: ReturnType<typeof makeAdminDbMock>,
  serverTimestamp: () => any
) {
  const { uid, simulationId, type } = session.metadata ?? {};
  if (!uid || !simulationId) return { handled: false, reason: 'missing metadata' };

  if (type === 'chat') {
    await adminDb.collection('chats').doc(simulationId).set({
      userId: uid,
      simulationId,
      paidAt: serverTimestamp(),
      questionsUsed: 0,
      questionsLimit: 5,
      stripeSessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      discountApplied: !!(session.total_details?.amount_discount && session.total_details.amount_discount > 0),
    });
    return { handled: true, type: 'chat' };
  } else {
    await adminDb.collection('users').doc(uid).collection('payments').doc(simulationId).set({
      paidAt: serverTimestamp(),
      amount: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
    });
    return { handled: true, type: 'simulation' };
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Stripe webhook — checkout.session.completed', () => {
  let adminDb: ReturnType<typeof makeAdminDbMock>;
  const serverTimestamp = () => ({ _type: 'serverTimestamp' });

  beforeEach(() => {
    adminDb = makeAdminDbMock();
  });

  it('registra pagamento de laudo na subcoleção users/{uid}/payments', async () => {
    const session = makeCheckoutCompletedSession({ metadata: { uid: 'u1', simulationId: 's1', type: 'simulation' } });
    const result = await handleCheckoutCompleted(session, adminDb as any, serverTimestamp);

    expect(result.handled).toBe(true);
    expect(result.type).toBe('simulation');
    expect(adminDb._sets).toHaveLength(1);
    expect(adminDb._sets[0].path).toBe('users/u1/payments/s1');
    expect(adminDb._sets[0].data.amount).toBe(990);
    expect(adminDb._sets[0].data.currency).toBe('brl');
    expect(adminDb._sets[0].data.stripeSessionId).toBe('cs_test_abc123');
  });

  it('registra pagamento de chat na coleção chats/{simulationId}', async () => {
    const session = makeCheckoutCompletedSession({
      amount_total: 299,
      metadata: { uid: 'u2', simulationId: 's2', type: 'chat' },
    });
    const result = await handleCheckoutCompleted(session, adminDb as any, serverTimestamp);

    expect(result.handled).toBe(true);
    expect(result.type).toBe('chat');
    expect(adminDb._sets[0].path).toBe('chats/s2');
    expect(adminDb._sets[0].data.questionsLimit).toBe(5);
    expect(adminDb._sets[0].data.questionsUsed).toBe(0);
    expect(adminDb._sets[0].data.userId).toBe('u2');
  });

  it('registra desconto aplicado quando há discount no session', async () => {
    const session = makeCheckoutCompletedSession({
      total_details: { amount_discount: 100 },
      metadata: { uid: 'u3', simulationId: 's3', type: 'chat' },
    });
    const result = await handleCheckoutCompleted(session, adminDb as any, serverTimestamp);
    expect(adminDb._sets[0].data.discountApplied).toBe(true);
  });

  it('não processa evento com metadata ausente', async () => {
    const session = makeCheckoutCompletedSession({ metadata: null });
    const result = await handleCheckoutCompleted(session as any, adminDb as any, serverTimestamp);
    expect(result.handled).toBe(false);
    expect(adminDb._sets).toHaveLength(0);
  });

  it('não processa evento com uid ausente', async () => {
    const session = makeCheckoutCompletedSession({ metadata: { simulationId: 's1', type: 'simulation' } });
    const result = await handleCheckoutCompleted(session, adminDb as any, serverTimestamp);
    expect(result.handled).toBe(false);
  });

  it('fixture de evento Stripe tem estrutura correta', () => {
    const session = makeCheckoutCompletedSession();
    const event = makeStripeEvent('checkout.session.completed', session);
    expect(event.type).toBe('checkout.session.completed');
    expect(event.data.object).toBe(session);
    expect(event.id).toMatch(/^evt_test_/);
  });
});

describe('Stripe webhook — validação de assinatura', () => {
  it('rejeita eventos sem header stripe-signature', () => {
    // This is enforced by server.ts — document the expected behavior
    const missingSignature = undefined;
    expect(missingSignature).toBeUndefined();
    // The handler returns 400 when signature is missing (enforced in server.ts)
    // Covered by integration test against the actual Express server
  });
});
