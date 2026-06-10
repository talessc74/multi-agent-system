/**
 * Gemini quota monitor — proactive balance check (edr-local-003)
 *
 * Run via Cloud Scheduler (daily) or inline cron.
 * Alerts when estimated usage exceeds 80% of the configured budget threshold.
 *
 * Usage:
 *   node --import=tsx/esm gemini-quota-monitor.ts
 *   or call scheduleGeminiQuotaCheck() from server startup for in-process scheduling.
 */

import { Resend } from 'resend';

const BUDGET_THRESHOLD_BRL = Number(process.env.GEMINI_BUDGET_THRESHOLD_BRL ?? 100);
const ALERT_THRESHOLD_PCT = 0.8;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface QuotaRecord {
  date: string; // YYYY-MM-DD
  estimatedSpendBRL: number;
}

// In-memory accumulator — server restarts reset it. Cloud Scheduler provides daily truth.
let dailyAccumulator: QuotaRecord = {
  date: todayKey(),
  estimatedSpendBRL: 0,
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Records a Gemini call's estimated cost. Called from each API route.
 * Rough estimate: Gemini 2.5 Flash ~R$0.10 per simulation call.
 */
export function recordGeminiCall(estimatedCostBRL = 0.10): void {
  const today = todayKey();
  if (dailyAccumulator.date !== today) {
    dailyAccumulator = { date: today, estimatedSpendBRL: 0 };
  }
  dailyAccumulator.estimatedSpendBRL += estimatedCostBRL;
}

async function sendQuotaAlert(
  pct: number,
  estimatedSpend: number,
  threshold: number
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL,
      subject: `⚠️ EAI? — Quota Gemini em ${Math.round(pct * 100)}% do orçamento`,
      html: `
        <h2>Alerta de quota Gemini — EAI? Jurídico</h2>
        <p><strong>Gasto estimado hoje:</strong> R$ ${estimatedSpend.toFixed(2)}</p>
        <p><strong>Threshold configurado:</strong> R$ ${threshold.toFixed(2)}</p>
        <p><strong>Utilização:</strong> ${Math.round(pct * 100)}%</p>
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <p><strong>Ação recomendada:</strong> Verificar saldo na conta de faturamento GCP e recarregar se necessário.</p>
        <hr/>
        <p style="color:#999;font-size:12px">EAI? Jurídico — Evidence-Based AI</p>
      `,
    });
    console.log(`[QuotaMonitor] Alerta enviado — ${Math.round(pct * 100)}% do orçamento utilizado`);
  } catch (e) {
    console.error('[QuotaMonitor] Falha ao enviar alerta:', e);
  }
}

export async function checkGeminiQuota(): Promise<void> {
  const today = todayKey();
  if (dailyAccumulator.date !== today) {
    dailyAccumulator = { date: today, estimatedSpendBRL: 0 };
  }

  const pct = dailyAccumulator.estimatedSpendBRL / BUDGET_THRESHOLD_BRL;
  console.log(
    `[QuotaMonitor] ${today} — estimado R$ ${dailyAccumulator.estimatedSpendBRL.toFixed(2)} ` +
    `/ R$ ${BUDGET_THRESHOLD_BRL.toFixed(2)} (${Math.round(pct * 100)}%)`
  );

  if (pct >= ALERT_THRESHOLD_PCT) {
    await sendQuotaAlert(pct, dailyAccumulator.estimatedSpendBRL, BUDGET_THRESHOLD_BRL);
  }
}

/**
 * Starts a daily quota check loop inside the server process.
 * Alternative to Cloud Scheduler for environments without external cron.
 */
export function scheduleGeminiQuotaCheck(): void {
  // Run once immediately on startup, then every 24h
  checkGeminiQuota().catch(console.error);
  setInterval(() => checkGeminiQuota().catch(console.error), CHECK_INTERVAL_MS);
  console.log('[QuotaMonitor] Checagem diária de quota Gemini agendada');
}
