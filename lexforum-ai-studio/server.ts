import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { validateCausaServer, simulateForumServer, generateReportServer } from "./src/lib/gemini.server";
import { constructWebhookEvent } from './src/lib/stripe.server.js';
import simulationStatus from './simulation-status';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
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
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/gemini/simulate", async (req, res) => {
    try {
      const { caseDescription, area, attachments, specificJudge } = req.body;
      const data = await simulateForumServer(caseDescription, area, attachments, specificJudge);
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/gemini/report", async (req, res) => {
    try {
      const { lastPetition, lastJudgment } = req.body;
      const data = await generateReportServer(lastPetition, lastJudgment);
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.use('/simulation', simulationStatus);

  // ── Stripe Webhook ──────────────────────────────────────────
  app.post(
    '/api/webhook/stripe',
    express.raw({ type: 'application/json' }),
    (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        res.status(400).send('Missing stripe-signature header');
        return;
      }

      try {
        const event = constructWebhookEvent(req.body, signature as string);

        switch (event.type) {
          case 'payment_intent.succeeded':
            console.log('[Stripe] payment_intent.succeeded:', event.data.object.id);
            // TODO: liberar laudo completo para o userId em metadata
            break;
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
