import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { validateCausaServer, simulateForumServer, generateReportServer, simulateMode5Server, generateCounterHypothesesServer, expandHypothesisServer } from "./src/lib/gemini.server";
import { constructWebhookEvent, stripe } from './src/lib/stripe.server.js';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import { setupSSE, sendSSE } from './sse-utils';
import { notifySpendingCap } from './alerts';
import { registerChatRoutes } from './chat-handler';
import { randomUUID } from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = admin.firestore();
import simulationStatus from './simulation-status';
import { resolveAgent } from './agent-resolver';
dotenv.config();

const app = express();
app.use((req, res, next) => {
  if (req.path === '/api/webhook/stripe') return next();
  express.json({ limit: '50mb' })(req, res, next);
});
const PORT = process.env.PORT || 3000;


async function startServer() {
  console.log("Starting server...");
  // API routes FIRST
  app.post("/api/gemini/validate", async (req, res) => {
    try {
      const { caseDescription, attachments } = req.body;
      const data = await validateCausaServer(caseDescription, attachments);
      res.json(data);
    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/gemini/validate');
      }
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/gemini/simulate", async (req, res) => {
    setupSSE(res);

    const { caseDescription, area, attachments, specificJudge, mode, defenseDescription, defenseAttachments, userSide } =
      req.body;

    const sessionId = randomUUID();
    const send = (event: string, data: object) => sendSSE(res, event, data);

    adminDb.collection('simRecovery').doc(sessionId).set({
      sessionId,
      status: 'pending',
      mode: mode ?? 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    }).catch(() => {});

    const areaMap: Record<string, string> = {
      CONSUMER: 'consumerista',
      LABOR: 'trabalhista',
      CIVIL: 'civel',
      FAMILY: 'familia',
      SOCIAL_SECURITY: 'previdenciario',
      OTHER: 'geral',
    };

    let agentInstruction: string | undefined;
    let judgeNameFromRegistry: string | undefined;
    try {
      const entry = await resolveAgent({
        area: areaMap[area] ?? area.toLowerCase(),
        comarca: specificJudge && specificJudge !== 'null' ? specificJudge : undefined,
        tipo: 'juiz',
      });
      const agentJson = entry.conteudo ?? JSON.parse(fs.readFileSync(path.join(process.cwd(), entry.arquivo), 'utf-8'));
      agentInstruction = JSON.stringify(agentJson);
      judgeNameFromRegistry = `Magistrado ${area === 'LABOR' ? 'Trabalhista' : area === 'CONSUMER' ? 'Consumerista' : area === 'CIVIL' ? 'Cível' : area === 'FAMILY' ? 'de Família' : area === 'SOCIAL_SECURITY' ? 'Previdenciário' : 'Especializado'}`;
      console.log(`[AgentResolver] Usando agente do registry: ${entry.agent_id}`);
    } catch (e) {
      console.warn('[AgentResolver] Fallback para agente dinâmico:', e instanceof Error ? e.message : e);
    }

    let lawyerInstruction: string | undefined;
    try {
      const lawyerSide = (mode === 2 || (mode === 4 && userSide === 'DEFENSE')) ? 'DEFENSE' : 'AUTHOR';
      const lawyerEntry = await resolveAgent({
        area: areaMap[area] ?? area.toLowerCase(),
        comarca: specificJudge && specificJudge !== 'null' ? specificJudge : undefined,
        tipo: 'advogado',
        userSide: lawyerSide,
      });
      const lawyerJson = lawyerEntry.conteudo ?? JSON.parse(fs.readFileSync(path.join(process.cwd(), lawyerEntry.arquivo), 'utf-8'));
      lawyerInstruction = JSON.stringify(lawyerJson);
      console.log(`[AgentResolver] Advogado do registry: ${lawyerEntry.agent_id}`);
    } catch (e) {
      console.warn('[AgentResolver] Advogado fallback dinâmico:', e instanceof Error ? e.message : e);
    }

    const lawyerDisplayName = `Advogado ${
      area === 'LABOR' ? 'Trabalhista' :
      area === 'CONSUMER' ? 'Consumerista' :
      area === 'CIVIL' ? 'Civilista' :
      area === 'FAMILY' ? 'de Família' :
      area === 'SOCIAL_SECURITY' ? 'Previdenciário' : 'Especializado'
    }`;
    send('agents', { lawyerName: lawyerDisplayName, judgeName: judgeNameFromRegistry ?? `Magistrado Especializado`, sessionId });

    try {
      const data = await simulateForumServer(
        caseDescription, area, attachments, specificJudge,
        agentInstruction,
        judgeNameFromRegistry,
        lawyerInstruction,
        mode ?? 1,
        defenseDescription ?? '',
        defenseAttachments ?? [],
        (step, round, roundData) => {
          send('progress', { step, round });
          if (roundData) send('round', roundData);
        },
        userSide
      );
      send('done', data);
      adminDb.collection('simRecovery').doc(sessionId).update({
        status: 'complete',
        result: data,
      }).catch(() => {});
    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/gemini/simulate');
      }
      adminDb.collection('simRecovery').doc(sessionId).update({
        status: 'error',
        errorMessage: error.message || 'Unknown error',
      }).catch(() => {});
      send('error', { message: error.message || 'Unknown error' });
    } finally {
      res.end();
    }
  });

  app.post("/api/gemini/report", async (req, res) => {
    try {
      const { lastPetition, lastJudgment } = req.body;
      const data = await generateReportServer(lastPetition, lastJudgment);
      res.json(data);
    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/gemini/report');
      }
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/counter-hypotheses", async (req, res) => {
    try {
      const { petition, area, mode } = req.body;
      if (!petition || !area) {
        return res.status(400).json({ error: "petition e area são obrigatórios" });
      }
      if (mode !== 1 && mode !== 2) {
        return res.status(400).json({ error: "mode deve ser 1 ou 2" });
      }
      const hypotheses = await generateCounterHypothesesServer(petition, area, mode);
      res.json({ hypotheses });
    } catch (error: any) {
      console.error("[counter-hypotheses] Erro:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/expand-hypothesis", async (req, res) => {
    try {
      const { petition, hypothesis, area } = req.body;
      if (!petition || !hypothesis || !area) {
        return res.status(400).json({ error: "petition, hypothesis e area são obrigatórios" });
      }
      const expanded = await expandHypothesisServer(petition, hypothesis, area);
      res.json({ expanded });
    } catch (error: any) {
      console.error("[expand-hypothesis] Erro:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/gemini/mode5", async (req, res) => {
    setupSSE(res);

    const { mode5Input, area, attachments, specificJudge } = req.body;

    const send = (event: string, data: object) => sendSSE(res, event, data);

    const areaMap: Record<string, string> = {
      CONSUMER: 'consumerista',
      LABOR: 'trabalhista',
      CIVIL: 'civel',
      FAMILY: 'familia',
      SOCIAL_SECURITY: 'previdenciario',
      OTHER: 'geral',
    };

    let agentInstruction: string | undefined;
    let agentName: string | undefined;
    try {
      const entry = await resolveAgent({
        area: areaMap[area] ?? area.toLowerCase(),
        comarca: specificJudge && specificJudge !== 'null' ? specificJudge : undefined,
        tipo: 'juiz',
      });
      const agentJson = entry.conteudo ?? JSON.parse(fs.readFileSync(path.join(process.cwd(), entry.arquivo), 'utf-8'));
      agentInstruction = JSON.stringify(agentJson);
      agentName = `Magistrado ${area === 'LABOR' ? 'Trabalhista' : area === 'CONSUMER' ? 'Consumerista' : area === 'CIVIL' ? 'Cível' : area === 'FAMILY' ? 'de Família' : area === 'SOCIAL_SECURITY' ? 'Previdenciário' : 'Especializado'}`;
      console.log(`[Mode5] Agente do registry: ${entry.agent_id}`);
    } catch (e) {
      console.warn('[Mode5] Fallback para Juiz Estrategista dinâmico:', e instanceof Error ? e.message : e);
    }

    try {
      await simulateMode5Server(
        mode5Input,
        area,
        attachments ?? [],
        specificJudge ?? null,
        agentInstruction,
        agentName,
        (step: string, data?: any) => {
          console.log(`[Mode5] ${step}`);
          send('progress', { step });
          if (step === 'DONE' && data) send('done', data);
        }
      );
    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/gemini/mode5');
      }
      console.error('[Mode5] Erro:', error);
      send('error', { message: error.message || 'Unknown error' });
    } finally {
      res.end();
    }
  });

  registerChatRoutes(app, adminDb);

  app.use('/simulation', simulationStatus);

  // ── Stripe Promo Code Validation ────────────────────────────────
  const promoValidateAttempts = new Map<string, { count: number; resetAt: number }>();

  app.post('/api/stripe/validate-promo-code', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      uid = decoded.uid;
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const now = Date.now();
    const bucket = promoValidateAttempts.get(uid);
    if (bucket && now < bucket.resetAt) {
      if (bucket.count >= 5) {
        res.status(429).json({ error: 'Muitas tentativas. Aguarde um momento.' });
        return;
      }
      bucket.count++;
    } else {
      promoValidateAttempts.set(uid, { count: 1, resetAt: now + 60_000 });
    }

    const { code, mode } = req.body;
    if (!code) {
      res.status(400).json({ error: 'code required' });
      return;
    }
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: (code as string).trim().toUpperCase(),
        active: true,
        limit: 1,
      });

      if (!promoCodes.data.length) {
        res.json({ valid: false });
        return;
      }

      const promoCode = promoCodes.data[0];
      const coupon = promoCode.coupon;
      const baseAmount = (mode === 3 || mode === 5) ? 590 : 990;

      let finalAmount = baseAmount;
      let discountLabel = '';

      if (coupon.percent_off) {
        finalAmount = Math.round(baseAmount * (1 - coupon.percent_off / 100));
        discountLabel = `${coupon.percent_off}% off`;
      } else if (coupon.amount_off) {
        finalAmount = Math.max(0, baseAmount - coupon.amount_off);
        discountLabel = `R$ ${(coupon.amount_off / 100).toFixed(2).replace('.', ',')} off`;
      }

      res.json({
        valid: true,
        discountLabel,
        finalAmount,
        finalAmountFormatted: `R$ ${(finalAmount / 100).toFixed(2).replace('.', ',')}`,
      });
    } catch (err: any) {
      console.error('[Stripe] validate-promo-code error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // ────────────────────────────────────────────────────────────

  // ── Stripe Checkout Session ────────────────────────────────────
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      const { simulationId, mode, promoCode } = req.body;
      if (!simulationId) {
        res.status(400).json({ error: 'simulationId required' });
        return;
      }

      const simRef = adminDb.collection('simulations').doc(simulationId);
      const simSnap = await simRef.get();
      if (!simSnap.exists || simSnap.data()?.userId !== uid) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      let sessionDiscounts: Array<{ promotion_code: string }> | undefined;
      let allowPromoCodes = true;

      if (promoCode) {
        const promoCodes = await stripe.promotionCodes.list({
          code: (promoCode as string).trim().toUpperCase(),
          active: true,
          limit: 1,
        });
        if (promoCodes.data.length > 0) {
          sessionDiscounts = [{ promotion_code: promoCodes.data[0].id }];
          allowPromoCodes = false;
        }
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: { name: `Laudo Estratégico EAI? — R$ ${(mode === 3 || mode === 5) ? '5,90' : '9,90'}` },
            unit_amount: (mode === 3 || mode === 5) ? 590 : 990,
          },
          quantity: 1,
        }],
        mode: 'payment',
        ...(sessionDiscounts ? { discounts: sessionDiscounts } : { allow_promotion_codes: true }),
        success_url: `${process.env.APP_URL}/?session_id={CHECKOUT_SESSION_ID}&sim=${simulationId}`,
        cancel_url: `${process.env.APP_URL}/`,
        metadata: { uid, simulationId },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('[Stripe] create-checkout-session error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // ────────────────────────────────────────────────────────────

  // ── Stripe Checkout Session — Chat pós-sessão ─────────────────
  app.post('/api/stripe/create-chat-checkout-session', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      const { simulationId } = req.body;
      if (!simulationId) {
        res.status(400).json({ error: 'simulationId required' });
        return;
      }

      const simSnap = await adminDb.collection('simulations').doc(simulationId).get();
      if (!simSnap.exists || simSnap.data()?.userId !== uid) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const chatSnap = await adminDb.collection('chats').doc(simulationId).get();
      if (chatSnap.exists && chatSnap.data()?.paidAt) {
        res.status(409).json({ error: 'Chat já liberado para esta simulação' });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: { name: 'Chat com Advogado e Juiz — EAI? (5 perguntas)' },
            unit_amount: 299,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/?session_id={CHECKOUT_SESSION_ID}&sim=${simulationId}&chat=1`,
        cancel_url: `${process.env.APP_URL}/`,
        metadata: { uid, simulationId, type: 'chat' },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('[Stripe] create-chat-checkout-session error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // ────────────────────────────────────────────────────────────

  // ── Stripe Webhook ──────────────────────────────────────────
  app.post(
    '/api/webhook/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        res.status(400).send('Missing stripe-signature header');
        return;
      }

      try {
        const event = constructWebhookEvent(req.body, signature as string);

        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const { uid, simulationId, type } = session.metadata || {};
            if (uid && simulationId) {
              if (type === 'chat') {
                await adminDb.collection('chats').doc(simulationId).set({
                  userId: uid,
                  simulationId,
                  paidAt: admin.firestore.FieldValue.serverTimestamp(),
                  questionsUsed: 0,
                  questionsLimit: 5,
                  stripeSessionId: session.id,
                  amount: session.amount_total,
                  currency: session.currency,
                  discountApplied: !!(session.total_details?.amount_discount && session.total_details.amount_discount > 0),
                });
                console.log(`[Stripe] Chat liberado — uid: ${uid}, sim: ${simulationId}`);
              } else {
                await adminDb
                  .collection('users')
                  .doc(uid)
                  .collection('payments')
                  .doc(simulationId)
                  .set({
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    amount: session.amount_total,
                    currency: session.currency,
                    stripeSessionId: session.id,
                  });
                console.log(`[Stripe] Laudo liberado — uid: ${uid}, sim: ${simulationId}`);
              }
            }
            break;
          }
          case 'payment_intent.payment_failed':
            console.log('[Stripe] payment_intent.payment_failed:', event.data.object.id);
            break;
          default:
            console.log('[Stripe] evento ignorado:', event.type);
        }

        res.json({ received: true });
      } catch (err) {
        console.error('[Stripe] webhook error:', err instanceof Error ? err.message : err);
        res.status(400).send('Webhook signature verification failed');
      }
    }
  );
  // ────────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> EAI? SERVER READY ON PORT ${PORT} <<<`);
  });
}

startServer();
