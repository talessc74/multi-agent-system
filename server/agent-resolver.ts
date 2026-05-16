import fs from 'fs';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'registry/index');

interface AgentEntry {
  agent_id: string;
  tipo: string;
  comarca: string | null;
  arquivo: string;
  seed: string;
}

interface ResolveParams {
  area: string;
  comarca?: string;
  tipo: 'juiz' | 'advogado' | 'desembargadora';
}

function findAgent(params: ResolveParams): AgentEntry | null {
  const filePath = path.join(REGISTRY_PATH, `${params.area}.json`);

  if (!fs.existsSync(filePath)) return null;

  const registry = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const agentes: AgentEntry[] = registry.agentes;

  // Busca por comarca específica primeiro
  if (params.comarca) {
    const match = agentes.find(
      a => a.tipo === params.tipo && a.comarca === params.comarca
    );
    if (match) return match;
  }

  // Fallback: agente genérico da área
  return agentes.find(a => a.tipo === params.tipo) ?? null;
}

async function createAgent(params: ResolveParams): Promise<AgentEntry> {
  // Placeholder — Shaw + Especialista serão integrados aqui
  // Por ora, loga a lacuna e lança erro descritivo
  console.warn(`[AgentResolver] Lacuna detectada: ${JSON.stringify(params)}`);
  throw new Error(
    `Agente não encontrado para área=${params.area}, tipo=${params.tipo}, comarca=${params.comarca ?? 'genérico'}. Shaw + Especialista necessários.`
  );
}

export async function resolveAgent(params: ResolveParams): Promise<AgentEntry> {
  const found = findAgent(params);
  if (found) {
    console.log(`[AgentResolver] Agente encontrado na prateleira: ${found.agent_id}`);
    return found;
  }

  console.log(`[AgentResolver] Lacuna detectada — acionando criação.`);
  return await createAgent(params);
}
