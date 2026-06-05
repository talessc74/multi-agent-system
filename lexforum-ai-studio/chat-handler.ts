import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import type { Application, Request, Response } from 'express';
import { resolveAgent } from './agent-resolver';
import { buildChatContext, sanitizeMessage } from './chat-context-builder';
import { chatWithAgentServer } from './src/lib/gemini.server';
import { anonymizeText } from './src/lib/anonymizer';
import { setupSSE, sendSSE } from './sse-utils';
import { notifySpendingCap } from './alerts';

const QUESTIONS_LIMIT = 5;

const AREA_MAP: Record<string, string> = {
  CONSUMER: 'consumerista',
  LABOR: 'trabalhista',
  CIVIL: 'civel',
  FAMILY: 'familia',
  SOCIAL_SECURITY: 'previdenciario',
  OTHER: 'geral',
};

export function registerChatRoutes(
  app: Application,
  adminDb: admin.firestore.Firestore
): void {

  // Returns chat session status (paid? questions remaining?)
  app.get('/api/chat/status/:simulationId', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      const { simulationId } = req.params;

      const simSnap = await adminDb.collection('simulations').doc(simulationId).get();
      if (!simSnap.exists || simSnap.data()?.userId !== uid) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const userSnap = await adminDb.collection('users').doc(uid).get();
      const isBeta = userSnap.data()?.accessLevel === 'beta';

      const chatSnap = await adminDb.collection('chats').doc(simulationId).get();
      if (!chatSnap.exists) {
        res.json({ isPaid: isBeta, questionsUsed: 0, questionsLimit: QUESTIONS_LIMIT });
        return;
      }

      const chatData = chatSnap.data()!;
      res.json({
        isPaid: isBeta || !!chatData.paidAt,
        questionsUsed: chatData.questionsUsed ?? 0,
        questionsLimit: chatData.questionsLimit ?? QUESTIONS_LIMIT,
      });
    } catch (err: any) {
      console.error('[Chat] status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Sends a message to the lawyer or judge — SSE stream
  app.post('/api/chat/message', async (req: Request, res: Response) => {
    setupSSE(res);

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendSSE(res, 'error', { code: 401, message: 'Unauthorized' });
      res.end();
      return;
    }

    const { simulationId, agentType, message } = req.body as {
      simulationId?: string;
      agentType?: 'lawyer' | 'judge';
      message?: string;
    };

    if (!simulationId || !agentType || !message) {
      sendSSE(res, 'error', { code: 400, message: 'simulationId, agentType e message são obrigatórios' });
      res.end();
      return;
    }

    if (agentType !== 'lawyer' && agentType !== 'judge') {
      sendSSE(res, 'error', { code: 400, message: 'agentType deve ser "lawyer" ou "judge"' });
      res.end();
      return;
    }

    try {
      // Guard 1 — Auth
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      // Guard 2 — Ownership
      const simSnap = await adminDb.collection('simulations').doc(simulationId).get();
      if (!simSnap.exists || simSnap.data()?.userId !== uid) {
        sendSSE(res, 'error', { code: 403, message: 'Forbidden' });
        res.end();
        return;
      }
      const simData = simSnap.data()!;

      // Guard 2.5 — Beta check
      const userSnap = await adminDb.collection('users').doc(uid).get();
      const isBeta = userSnap.data()?.accessLevel === 'beta';

      // Guard 3 — Payment (waived for beta users)
      const chatRef = adminDb.collection('chats').doc(simulationId);
      let chatSnap = await chatRef.get();
      if (!isBeta && (!chatSnap.exists || !chatSnap.data()?.paidAt)) {
        sendSSE(res, 'error', { code: 402, message: 'Chat não liberado. Efetue o pagamento para continuar.' });
        res.end();
        return;
      }
      if (!chatSnap.exists) {
        await chatRef.set({
          userId: uid,
          simulationId,
          betaAccess: true,
          questionsUsed: 0,
          questionsLimit: QUESTIONS_LIMIT,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        chatSnap = await chatRef.get();
      }
      const chatData = chatSnap.data()!;

      // Guard 4 — Question limit
      const questionsUsed: number = chatData.questionsUsed ?? 0;
      if (questionsUsed >= QUESTIONS_LIMIT) {
        sendSSE(res, 'error', { code: 429, message: 'Limite de perguntas atingido para esta sessão.' });
        res.end();
        return;
      }

      // LGPD: mark chat start on first message
      if (questionsUsed === 0) {
        await chatRef.update({ chatStartedAt: admin.firestore.FieldValue.serverTimestamp() });
      }

      // Resolve agent instruction
      const area = simData.area as string;
      let agentInstruction = '';
      try {
        const entry = await resolveAgent({
          area: AREA_MAP[area] ?? area.toLowerCase(),
          tipo: agentType === 'lawyer' ? 'advogado' : 'juiz',
        });
        const agentJson = entry.conteudo
          ?? JSON.parse(fs.readFileSync(path.join(process.cwd(), entry.arquivo), 'utf-8'));
        agentInstruction = JSON.stringify(agentJson);
      } catch (e) {
        console.warn('[Chat] Fallback para instrução genérica:', e instanceof Error ? e.message : e);
        agentInstruction = agentType === 'lawyer'
          ? 'Você é um advogado especializado. Responda com base no caso apresentado.'
          : 'Você é um magistrado especializado. Responda com base no caso apresentado.';
      }

      // Build context
      const { agentName, systemInstruction } = buildChatContext(
        {
          area,
          caseDescription: simData.caseDescription as string,
          caseSummary: simData.caseSummary as string | null,
          finalSuccessProbability: simData.finalSuccessProbability as number,
          lawyerAgentName: simData.lawyerAgentName as string | undefined,
          judgeAgentName: simData.judgeAgentName as string | undefined,
          mode5Result: simData.mode5Result ?? null,
        },
        agentType,
        agentInstruction
      );

      // Load recent history for multi-turn context
      const historySnap = await chatRef
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(8)
        .get();

      const history = historySnap.docs.map(d => ({
        role: d.data().role === 'user' ? 'user' as const : 'model' as const,
        content: d.data().content as string,
      }));

      // Sanitize message
      const sanitized = sanitizeMessage(message);

      sendSSE(res, 'thinking', { agentName });

      // Call Gemini
      const agentResponse = await chatWithAgentServer(systemInstruction, history, sanitized);

      // Persist messages + increment counter (atomic batch)
      const batch = adminDb.batch();
      const messagesRef = chatRef.collection('messages');

      batch.set(messagesRef.doc(), {
        role: 'user',
        content: anonymizeText(sanitized),
        agentType,
        agentName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(messagesRef.doc(), {
        role: 'agent',
        content: anonymizeText(agentResponse),
        agentType,
        agentName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.update(chatRef, {
        questionsUsed: admin.firestore.FieldValue.increment(1),
      });
      await batch.commit();

      const questionsRemaining = QUESTIONS_LIMIT - (questionsUsed + 1);
      sendSSE(res, 'message', { agentName, agentType, content: agentResponse, questionsRemaining });

    } catch (error: any) {
      if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        await notifySpendingCap('/api/chat/message');
      }
      console.error('[Chat] Erro:', error);
      sendSSE(res, 'error', { message: error.message || 'Erro interno' });
    } finally {
      res.end();
    }
  });
}
