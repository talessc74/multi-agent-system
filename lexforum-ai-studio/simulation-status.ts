import { Router, Request, Response } from 'express';

const router = Router();

// Mapa de sessões ativas — sessionId → função para emitir eventos
const sessions = new Map<string, Response>();

// Eventos possíveis por etapa
export const SimulationEvents = {
  READING:        'Lendo sua causa...',
  IDENTIFYING:    'Identificando a área do direito...',
  CONSULTING:     'Consultando nossos especialistas...',
  CREATING_AGENT: 'Identificamos seu caso — estamos preparando seu advogado especializado...',
  AGENT_READY:    'Seu advogado está pronto.',
  FOUND_AGENT:    'Advogado encontrado. Preparando sua simulação...',
  ROUND_1:        'Iniciando a simulação — Round 1...',
  ROUND_2:        'Refinando os argumentos — Round 2...',
  ROUND_3:        'Elaborando o veredito final...',
  DONE:           'Pronto.',
};

// Rota SSE — cliente escuta aqui
router.get('/status/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sessions.set(sessionId, res);

  // Limpar sessão quando cliente desconectar
  req.on('close', () => {
    sessions.delete(sessionId);
  });
});

// Função exportada — usada pelo AgentResolver e pela simulação
export function emitEvent(sessionId: string, event: keyof typeof SimulationEvents) {
  const res = sessions.get(sessionId);
  if (!res) return;

  const message = SimulationEvents[event];
  res.write(`data: ${JSON.stringify({ message })}\n\n`);

  if (event === 'DONE') {
    res.end();
    sessions.delete(sessionId);
  }
}

export default router;
