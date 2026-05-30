import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { validateCausaServer, simulateForumServer, generateReportServer, simulateMode5Server, generateCounterHypothesesServer, expandHypothesisServer } from "./src/lib/gemini.server";
import { constructWebhookEvent, stripe } from './src/lib/stripe.server.js';
import admin from 'firebase-admin';
import Stripe from 'stripe';

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
import { Resend } from 'resend';

dotenv.config();

const app = express();
app.use((req, res, next) => {
  if (req.path === '/api/webhook/stripe') return next();
  express.json({ limit: '50mb' })(req, res, next);
});
const PORT = process.env.PORT || 3000;

async function notifySpendingCap(route: string) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL,
      subject: '🚨 EAI? — Limite de IA atingido',
      html: `
        <h2>Alerta crítico — EAI?</h2>
        <p><strong>Erro:</strong> RESOURCE_EXHAUSTED (Spending Cap)</p>
        <p><strong>Rota:</strong> ${route}</p>
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <p><strong>Ação necessária:</strong> Aumentar Spending Cap no GCP</p>
        <hr/>
        <p style="color:#999;font-size:12px">EAI? — eai.radiokactus.com</p>
      `
    });
  } catch (e) {
    console.error('[ALERT] Falha ao enviar email de alerta:', e);
  }
}

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
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { caseDescription, area, attachments, specificJudge, mode, defenseDescription, defenseAttachments, userSide } =
      req.body;

    const send = (event: string, data: object) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

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
      const lawyerSide = (mode === 2) ? 'DEFENSE' : 'AUTHOR';
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
    send('agents', { lawyerName: lawyerDisplayName, judgeName: judgeNameFromRegistry ?? `Magistrado Especializado` });

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
    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/gemini/simulate');
      }
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
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { mode5Input, area, attachments, specificJudge } = req.body;

    const send = (event: string, data: object) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

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

  app.use('/simulation', simulationStatus);

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

      const { simulationId, mode } = req.body;
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
            const { uid, simulationId } = session.metadata || {};
            if (uid && simulationId) {
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
              console.log(`[Stripe] Pagamento liberado — uid: ${uid}, sim: ${simulationId}`);
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
