import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { createAgentFromScratch } from './agent-creator';

// Em produção, o build copia registry/ para dentro de lexforum-ai-studio/ antes
// de empacotar (ver cloudbuild.yaml), então process.cwd() resolve corretamente.
// AGENT_REGISTRY_PATH permite apontar para outro local em dev/test sem depender
// dessa coincidência de layout.
function getRegistryPath(): string {
  return process.env.AGENT_REGISTRY_PATH || path.join(process.cwd(), 'registry/index');
}

interface AgentEntry {
  agent_id: string;
  tipo: string;
  area?: string;
  comarca: string | null;
  arquivo: string;
  seed: string;
  conteudo?: Record<string, any>;
}

interface ResolveParams {
  area: string;
  comarca?: string;
  tipo: 'juiz' | 'advogado' | 'desembargadora';
  userSide?: 'AUTHOR' | 'DEFENSE';
}

// Toda entrada do registry local declara sua própria área (curadoria), e essa
// declaração é validada contra a área solicitada antes de ser aceita. Isso não
// verifica o conteúdo semântico da seed, mas pega o erro de curadoria mais comum:
// uma entrada arquivada sob a área errada (ex: ver _local-adr-001 e o incidente
// do juiz_everton_v1.0, originalmente listado em trabalhista.json).
export function findAgentLocal(params: ResolveParams): AgentEntry | null {
  const filePath = path.join(getRegistryPath(), `${params.area}.json`);
  if (!fs.existsSync(filePath)) return null;

  const registry = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const agentes: AgentEntry[] = registry.agentes;

  const candidates = agentes.filter(a => a.tipo === params.tipo);
  for (const a of candidates) {
    if (a.area !== undefined && a.area !== params.area) {
      console.warn(`[AgentResolver] Entrada ${a.agent_id} em ${params.area}.json declara area "${a.area}" — descartada`);
    }
  }
  const valid = candidates.filter(a => a.area === undefined || a.area === params.area);

  if (params.comarca) {
    const match = valid.find(a => a.comarca === params.comarca);
    if (match) return match;
  }

  return valid[0] ?? null;
}

// Agentes criados antes das correções EDR-007/BDR-003 são rejeitados e regerados
const AGENT_MIN_VERSION = '1.1';

async function findAgentFirestore(params: ResolveParams): Promise<AgentEntry | null> {
  try {
    const db = admin.firestore();
    let query = db.collection('agents')
      .where('area', '==', params.area)
      .where('tipo', '==', params.tipo);

    // Juiz é imparcial — sem filtro de lado
    if (params.tipo !== 'juiz') {
      const lado = params.userSide === 'DEFENSE' ? 'defesa' : 'acusacao';
      query = query.where('lado', '==', lado);
    }

    if (params.comarca) {
      query = query.where('comarca', '==', params.comarca);
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0].data();
    if (!doc.conteudo) {
      console.warn(`[AgentResolver] Agente ${doc.agent_id} sem conteudo — regenerando`);
      return null;
    }
    if (!doc.versao || doc.versao < AGENT_MIN_VERSION) {
      console.warn(`[AgentResolver] Agente ${doc.agent_id} versão ${doc.versao ?? 'ausente'} abaixo do mínimo ${AGENT_MIN_VERSION} — regenerando`);
      return null;
    }
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
    userSide: params.userSide,
  });

  const entry: AgentEntry = {
    agent_id: result.agent_id,
    tipo: params.tipo,
    // BDR-003: juiz nunca armazena comarca — evita identificação por localização
    comarca: params.tipo === 'juiz' ? null : (params.comarca ?? null),
    arquivo: `agents/${result.agent_id}_v1.0.json`,
    seed: result.seed_id,
    conteudo: result.agente,
  };

  try {
    const db = admin.firestore();
    const docData: Record<string, any> = {
      ...entry,
      area: params.area,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      criadoPor: 'EspecialistaV2',
      versao: '1.1',
    };
    // Juiz é imparcial — não armazena lado
    if (params.tipo !== 'juiz') {
      docData.lado = params.userSide === 'DEFENSE' ? 'defesa' : 'acusacao';
    }
    await db.collection('agents').doc(result.agent_id).set(docData);
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
