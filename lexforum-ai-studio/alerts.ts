import { Resend } from 'resend';

export async function notifySpendingCap(route: string): Promise<void> {
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
      `,
    });
  } catch (e) {
    console.error('[ALERT] Falha ao enviar email de alerta:', e);
  }
}
