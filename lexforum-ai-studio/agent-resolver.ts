import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { createAgentFromScratch } from './agent-creator';

const REGISTRY_PATH = path.join(process.cwd(), 'registry/index');

interface AgentEntry {
  agent_id: string;
  tipo: string;
  comarca: string | null;
  arquivo: string;
  seed: string;
  conteudo?: Record<string, any>;
}

interface ResolveParams {
  area: string;
  comarca?: string;
  tipo: 'juiz' | 'advogado' | 'desembargadora';
}

function findAgentLocal(params: ResolveParams): AgentEntry | null {
  const filePath = path.join(REGISTRY_PATH, `${params.area}.json`);
  if (!fs.existsSync(filePath)) return null;

  const registry = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const agentes: AgentEntry[] = registry.agentes;

  if (params.comarca) {
    const match = agentes.find(
      a => a.tipo === params.tipo && a.comarca === params.comarca
    );
    if (match) return match;
  }

  return agentes.find(a => a.tipo === params.tipo) ?? null;
}

async function findAgentFirestore(params: ResolveParams): Promise<AgentEntry | null> {
  try {
    const db = admin.firestore();
    let query = db.collection('agents')
      .where('area', '==', params.area)
      .where('tipo', '==', params.tipo);

    if (params.comarca) {
      query = query.where('comarca', '==', params.comarca);
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0].data();
    console.log(`[AgentResolver] Prateleira Firestore: ${doc.agent_id}`);
    return doc as AgentEntry;
  } catch (e) {
    console.warn('[AgentResolver] Erro ao buscar no Firestore:', e instanceof Error ? e.message : e);
    return null;
  }
}

async function createAndSaveAgent(params: ResolveParams): Promise<AgentEntry> {
  const areaCode = params.area.slice(0, 3).toUpperCase();
  const sequencial = String(Date.now()).slice(-6);

  const result = await createAgentFromScratch({
    area: params.area,
    comarca: params.comarca,
    tipo: params.tipo,
    areaCode,
    sequencial,
  });

  const entry: AgentEntry = {
    agent_id: result.agent_id,
    tipo: params.tipo,
    comarca: params.comarca ?? null,
    arquivo: `agents/${result.agent_id}_v1.0.json`,
    seed: result.seed_id,
    conteudo: result.agente,
  };

  try {
    const db = admin.firestore();
    await db.collection('agents').doc(result.agent_id).set({
      ...entry,
      area: params.area,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      criadoPor: 'EspecialistaV1',
      versao: '1.0',
    });
    console.log(`[AgentResolver] Criado e salvo na prateleira: ${result.agent_id}`);
  } catch (e) {
    console.warn('[AgentResolver] Erro ao salvar no Firestore:', e instanceof Error ? e.message : e);
  }

  return entry;
}

export async function resolveAgent(params: ResolveParams): Promise<AgentEntry> {
  const local = findAgentLocal(params);
  if (local) {
    console.log(`[AgentResolver] Registry local: ${local.agent_id}`);
    return local;
  }

  const firestore = await findAgentFirestore(params);
  if (firestore) return firestore;

  console.log(`[AgentResolver] Lacuna detectada — acionando criação para área: ${params.area} tipo: ${params.tipo}`);
  return await createAndSaveAgent(params);
}
