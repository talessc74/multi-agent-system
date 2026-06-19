import { Resend } from 'resend';

// Evita flood de e-mails quando várias requisições falham pelo mesmo motivo
// ao mesmo tempo (ex.: pico de RESOURCE_EXHAUSTED). Estado por processo —
// em múltiplas instâncias do Cloud Run cada uma mantém sua própria janela,
// mas isso já corta o problema de "um e-mail por requisição falhada".
const ALERT_THROTTLE_MS = 10 * 60 * 1000; // 10 minutos
const lastSentAt = new Map<string, number>();

interface AlertOptions {
  reason: string;
  route: string;
  detail?: string;
}

const REASON_LABELS: Record<string, string> = {
  GEMINI_QUOTA: 'Limite de IA atingido (RESOURCE_EXHAUSTED)',
};

export async function notifyCriticalFailure({ reason, route, detail }: AlertOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return;

  const throttleKey = `${reason}:${route}`;
  const now = Date.now();
  const last = lastSentAt.get(throttleKey);
  if (last && now - last < ALERT_THROTTLE_MS) return;
  lastSentAt.set(throttleKey, now);

  const label = REASON_LABELS[reason] || reason;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL,
      subject: `🚨 EAI? — ${label}`,
      html: `
        <h2>Alerta crítico — EAI?</h2>
        <p><strong>Motivo:</strong> ${label}</p>
        <p><strong>Rota:</strong> ${route}</p>
        ${detail ? `<p><strong>Detalhe:</strong> ${detail}</p>` : ''}
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <p><strong>Ação necessária:</strong> Verificar Spending Cap / quota no GCP</p>
        <hr/>
        <p style="color:#999;font-size:12px">EAI? — eaijuridico.com.br · próximo alerta deste tipo só após ${ALERT_THROTTLE_MS / 60000} min</p>
      `,
    });
  } catch (e) {
    console.error('[ALERT] Falha ao enviar email de alerta:', e);
  }
}
