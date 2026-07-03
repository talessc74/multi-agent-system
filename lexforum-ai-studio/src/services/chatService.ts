import { auth } from '../lib/firebase';
import type { ChatMessage } from '../types';

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.getIdToken();
}

export async function getChatStatus(simulationId: string): Promise<{
  isPaid: boolean;
  questionsUsed: number;
  questionsLimit: number;
}> {
  const token = await getToken();
  const res = await fetch(`/api/chat/status/${simulationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao verificar status do chat');
  return res.json();
}

export async function getChatHistory(simulationId: string): Promise<ChatMessage[]> {
  const token = await getToken();
  const res = await fetch(`/api/chat/history/${simulationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao buscar histórico do chat');
  const data = await res.json();
  return data.messages;
}

export async function createChatCheckoutSession(simulationId: string): Promise<string> {
  const token = await getToken();
  const res = await fetch('/api/stripe/create-chat-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ simulationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar sessão de pagamento');
  }
  const { url } = await res.json();
  return url;
}

export type ChatEventType = 'thinking' | 'message' | 'error';

export interface ChatSSEEvent {
  type: ChatEventType;
  agentName?: string;
  agentType?: 'lawyer' | 'judge';
  content?: string;
  questionsRemaining?: number;
  code?: number;
  message?: string;
}

export async function sendChatMessage(
  simulationId: string,
  agentType: 'lawyer' | 'judge',
  message: string,
  onEvent: (event: ChatSSEEvent) => void
): Promise<void> {
  const token = await getToken();
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ simulationId, agentType, message }),
  });

  if (!res.ok || !res.body) {
    onEvent({ type: 'error', message: 'Erro de conexão' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let eventType: ChatEventType = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim() as ChatEventType;
        if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (data) {
        try {
          const parsed = JSON.parse(data);
          onEvent({ type: eventType, ...parsed });
        } catch {}
      }
    }
  }
}
