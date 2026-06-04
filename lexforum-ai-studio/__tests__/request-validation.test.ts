/**
 * Validates the input-guard logic for Express routes in server.ts.
 * Uses a minimal Express app that mirrors each route's validation block,
 * keeping the test isolated from Gemini, Firebase, and Stripe side effects.
 */
import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';

// ── Minimal app mirroring validation guards from server.ts ────────────────
const app = express();
app.use(express.json());

app.post('/api/counter-hypotheses', (req: Request, res: Response) => {
  const { petition, area, mode } = req.body;
  if (!petition || !area) {
    res.status(400).json({ error: 'petition e area são obrigatórios' });
    return;
  }
  if (mode !== 1 && mode !== 2) {
    res.status(400).json({ error: 'mode deve ser 1 ou 2' });
    return;
  }
  res.json({ hypotheses: [] });
});

app.post('/api/expand-hypothesis', (req: Request, res: Response) => {
  const { petition, hypothesis, area } = req.body;
  if (!petition || !hypothesis || !area) {
    res.status(400).json({ error: 'petition, hypothesis e area são obrigatórios' });
    return;
  }
  res.json({ expanded: '' });
});

app.post('/api/stripe/create-checkout-session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { simulationId } = req.body;
  if (!simulationId) {
    res.status(400).json({ error: 'simulationId required' });
    return;
  }
  res.json({ url: 'https://checkout.stripe.com/test' });
});

// ── /api/counter-hypotheses ───────────────────────────────────────────────
describe('POST /api/counter-hypotheses — input validation', () => {
  it('returns 400 when petition is missing', async () => {
    const { status, body } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ area: 'CONSUMER', mode: 1 });

    expect(status).toBe(400);
    expect(body.error).toMatch(/petition/i);
  });

  it('returns 400 when area is missing', async () => {
    const { status, body } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Peço indenização por dano moral', mode: 1 });

    expect(status).toBe(400);
    expect(body.error).toMatch(/area/i);
  });

  it('returns 400 when mode is 0', async () => {
    const { status, body } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Texto da petição', area: 'CONSUMER', mode: 0 });

    expect(status).toBe(400);
    expect(body.error).toMatch(/mode/i);
  });

  it('returns 400 when mode is 3', async () => {
    const { status, body } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Texto da petição', area: 'CONSUMER', mode: 3 });

    expect(status).toBe(400);
  });

  it('returns 400 when mode is a string', async () => {
    const { status } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Texto', area: 'CONSUMER', mode: '1' });

    expect(status).toBe(400);
  });

  it('accepts mode 1 with all required fields', async () => {
    const { status } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Peço indenização', area: 'CONSUMER', mode: 1 });

    expect(status).toBe(200);
  });

  it('accepts mode 2 with all required fields', async () => {
    const { status } = await request(app)
      .post('/api/counter-hypotheses')
      .send({ petition: 'Contesto a petição', area: 'LABOR', mode: 2 });

    expect(status).toBe(200);
  });
});

// ── /api/expand-hypothesis ────────────────────────────────────────────────
describe('POST /api/expand-hypothesis — input validation', () => {
  it('returns 400 when petition is missing', async () => {
    const { status } = await request(app)
      .post('/api/expand-hypothesis')
      .send({ hypothesis: 'Hipótese', area: 'CIVIL' });

    expect(status).toBe(400);
  });

  it('returns 400 when hypothesis is missing', async () => {
    const { status } = await request(app)
      .post('/api/expand-hypothesis')
      .send({ petition: 'Petição', area: 'CIVIL' });

    expect(status).toBe(400);
  });

  it('returns 400 when area is missing', async () => {
    const { status } = await request(app)
      .post('/api/expand-hypothesis')
      .send({ petition: 'Petição', hypothesis: 'Hipótese' });

    expect(status).toBe(400);
  });

  it('accepts request with all required fields', async () => {
    const { status } = await request(app)
      .post('/api/expand-hypothesis')
      .send({ petition: 'Petição detalhada', hypothesis: 'Hipótese de defesa', area: 'CIVIL' });

    expect(status).toBe(200);
  });
});

// ── /api/stripe/create-checkout-session ──────────────────────────────────
describe('POST /api/stripe/create-checkout-session — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { status } = await request(app)
      .post('/api/stripe/create-checkout-session')
      .send({ simulationId: 'sim_123' });

    expect(status).toBe(401);
  });

  it('returns 401 when Authorization header has wrong scheme', async () => {
    const { status } = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send({ simulationId: 'sim_123' });

    expect(status).toBe(401);
  });

  it('returns 400 when simulationId is missing even with auth', async () => {
    const { status } = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', 'Bearer any_token')
      .send({});

    expect(status).toBe(400);
  });
});
