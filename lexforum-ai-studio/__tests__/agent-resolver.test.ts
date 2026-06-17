import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { findAgentLocal } from '../agent-resolver';

const REGISTRY_PATH = path.join(__dirname, '..', '..', 'registry', 'index');

beforeAll(() => {
  process.env.AGENT_REGISTRY_PATH = REGISTRY_PATH;
});

afterAll(() => {
  delete process.env.AGENT_REGISTRY_PATH;
});

function readRegistry(area: string): { area: string; agentes: Array<Record<string, any>> } {
  const filePath = path.join(REGISTRY_PATH, `${area}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('registry local — coerência área declarada', () => {
  const files = fs.readdirSync(REGISTRY_PATH).filter(f => f.endsWith('.json'));

  it.each(files)('toda entrada em %s declara area igual ao nome do arquivo', (file) => {
    const areaDoArquivo = path.basename(file, '.json');
    const registry = readRegistry(areaDoArquivo);

    for (const agente of registry.agentes) {
      expect(agente.area, `${agente.agent_id} em ${file} deve declarar area="${areaDoArquivo}"`).toBe(areaDoArquivo);
    }
  });
});

describe('findAgentLocal', () => {
  it('descarta entrada cuja area declarada não corresponde à area solicitada', () => {
    // juiz_everton_v1.0 pertence a civel.json — não deve mais ser resolvido para trabalhista
    const result = findAgentLocal({ area: 'trabalhista', tipo: 'juiz' });
    expect(result).toBeNull();
  });

  it('resolve o juiz correto quando area e tipo coincidem', () => {
    const result = findAgentLocal({ area: 'civel', tipo: 'juiz' });
    expect(result?.agent_id).toBe('juiz_everton_v1.0');
  });

  it('resolve a desembargadora trabalhista corretamente', () => {
    const result = findAgentLocal({ area: 'trabalhista', tipo: 'desembargadora' });
    expect(result?.agent_id).toBe('juiza_rosemarie_v1.0');
  });

  it('retorna null quando não há arquivo de registry para a area', () => {
    const result = findAgentLocal({ area: 'inexistente', tipo: 'juiz' });
    expect(result).toBeNull();
  });
});
