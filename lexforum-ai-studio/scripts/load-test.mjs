#!/usr/bin/env node
/**
 * Load test contra os endpoints de IA do EAI? (validate, simulate, report,
 * counter-hypotheses, expand-hypothesis, mode5).
 *
 * Cada requisição real aciona pelo menos uma chamada ao Gemini — isso tem
 * custo e conta contra o anomalyGuard (20 req/min por IP, ver server.ts).
 * Use concorrência e volume baixos para um primeiro teste; suba devagar.
 *
 * Uso:
 *   node scripts/load-test.mjs --base-url=https://eai-staging-xxxx.run.app \
 *     --endpoint=validate --concurrency=3 --requests=10
 *
 * Flags:
 *   --base-url     (obrigatório) URL do ambiente a testar (staging!)
 *   --endpoint     validate | simulate | report | counter-hypotheses |
 *                  expand-hypothesis | mode5   (default: validate)
 *   --concurrency  requisições simultâneas (default: 3)
 *   --requests     total de requisições a enviar (default: 10)
 *   --dry-run      não envia nada, só mostra o plano e sai
 *   --force        obrigatório se --requests > 50 (limite de segurança)
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  })
);

const BASE_URL = args['base-url'];
const ENDPOINT_NAME = args.endpoint ?? 'validate';
const CONCURRENCY = Number(args.concurrency ?? 3);
const TOTAL_REQUESTS = Number(args.requests ?? 10);
const DRY_RUN = Boolean(args['dry-run']);
const FORCE = Boolean(args.force);
const SAFETY_REQUEST_CEILING = 50;

if (!BASE_URL) {
  console.error('Erro: --base-url é obrigatório. Ex.: --base-url=https://eai-staging-xxxx.run.app');
  process.exit(1);
}

if (TOTAL_REQUESTS > SAFETY_REQUEST_CEILING && !FORCE) {
  console.error(
    `Erro: --requests=${TOTAL_REQUESTS} excede o limite de segurança de ${SAFETY_REQUEST_CEILING}.\n` +
    `Cada requisição gera custo real de Gemini. Use --force para confirmar que isso é intencional.`
  );
  process.exit(1);
}

const SAMPLE_CASE =
  'Comprei um eletrodoméstico que apresentou defeito em 10 dias. A loja se recusa a ' +
  'trocar ou devolver o valor pago, alegando que o prazo de garantia já expirou.';

const ENDPOINTS = {
  validate: {
    path: '/api/gemini/validate',
    stream: false,
    body: () => ({ caseDescription: SAMPLE_CASE, attachments: [] }),
  },
  simulate: {
    path: '/api/gemini/simulate',
    stream: true,
    body: () => ({
      caseDescription: SAMPLE_CASE,
      area: 'CONSUMER',
      attachments: [],
      specificJudge: null,
      mode: 1,
      defenseDescription: '',
      defenseAttachments: [],
      userSide: 'AUTHOR',
    }),
  },
  report: {
    path: '/api/gemini/report',
    stream: false,
    body: () => ({
      lastPetition: 'Petição inicial pleiteando troca do produto e indenização por danos morais.',
      lastJudgment: 'Pedido julgado parcialmente procedente. Determinada a devolução do valor pago.',
      clientSide: 'AUTHOR',
    }),
  },
  'counter-hypotheses': {
    path: '/api/counter-hypotheses',
    stream: false,
    body: () => ({
      petition: 'Petição inicial pleiteando troca do produto e indenização por danos morais.',
      area: 'CONSUMER',
      mode: 1,
    }),
  },
  'expand-hypothesis': {
    path: '/api/expand-hypothesis',
    stream: false,
    body: () => ({
      petition: 'Petição inicial pleiteando troca do produto e indenização por danos morais.',
      hypothesis: 'Inversão do ônus da prova por se tratar de relação de consumo.',
      area: 'CONSUMER',
    }),
  },
  mode5: {
    path: '/api/gemini/mode5',
    stream: true,
    body: () => ({
      mode5Input: SAMPLE_CASE,
      area: 'CONSUMER',
      attachments: [],
      specificJudge: null,
    }),
  },
};

const endpointConfig = ENDPOINTS[ENDPOINT_NAME];
if (!endpointConfig) {
  console.error(`Erro: endpoint desconhecido "${ENDPOINT_NAME}". Opções: ${Object.keys(ENDPOINTS).join(', ')}`);
  process.exit(1);
}

console.log('─────────────────────────────────────────────');
console.log('Plano do teste de carga');
console.log('─────────────────────────────────────────────');
console.log(`Base URL:     ${BASE_URL}`);
console.log(`Endpoint:     ${ENDPOINT_NAME} (${endpointConfig.path})`);
console.log(`Concorrência: ${CONCURRENCY}`);
console.log(`Requisições:  ${TOTAL_REQUESTS}`);
console.log('─────────────────────────────────────────────');

if (DRY_RUN) {
  console.log('Dry run — nenhuma requisição foi enviada.');
  process.exit(0);
}

async function sendNonStreaming(url, body) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const durationMs = performance.now() - start;
    await res.text().catch(() => {});
    return { ok: res.ok, status: res.status, durationMs };
  } catch (err) {
    return { ok: false, status: 'network-error', durationMs: performance.now() - start, error: err.message };
  }
}

async function sendStreaming(url, body) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      return { ok: false, status: res.status, durationMs: performance.now() - start };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalEvent = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const eventMatch = chunk.match(/^event: (.+)$/m);
        if (eventMatch) {
          const eventName = eventMatch[1].trim();
          if (eventName === 'done' || eventName === 'error') {
            finalEvent = eventName;
          }
        }
      }
      if (finalEvent) break;
    }
    reader.cancel().catch(() => {});

    const durationMs = performance.now() - start;
    return { ok: finalEvent === 'done', status: finalEvent ?? 'incomplete', durationMs };
  } catch (err) {
    return { ok: false, status: 'network-error', durationMs: performance.now() - start, error: err.message };
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const url = `${BASE_URL.replace(/\/$/, '')}${endpointConfig.path}`;
  const send = endpointConfig.stream ? sendStreaming : sendNonStreaming;
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < TOTAL_REQUESTS) {
      const i = nextIndex++;
      const result = await send(url, endpointConfig.body());
      results.push(result);
      process.stdout.write(result.ok ? '.' : 'x');
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS) }, () => worker());
  await Promise.all(workers);
  console.log('\n');

  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successes = results.filter((r) => r.ok).length;
  const failures = results.length - successes;
  const failureBreakdown = {};
  for (const r of results.filter((r) => !r.ok)) {
    const key = String(r.status);
    failureBreakdown[key] = (failureBreakdown[key] ?? 0) + 1;
  }

  console.log('─────────────────────────────────────────────');
  console.log('Resultado');
  console.log('─────────────────────────────────────────────');
  console.log(`Total:    ${results.length}`);
  console.log(`Sucesso:  ${successes}`);
  console.log(`Falha:    ${failures}`);
  if (failures > 0) {
    console.log(`Detalhe das falhas: ${JSON.stringify(failureBreakdown)}`);
  }
  console.log(`Latência min/p50/p95/max (ms): ${durations[0]?.toFixed(0) ?? '-'} / ` +
    `${percentile(durations, 50).toFixed(0)} / ${percentile(durations, 95).toFixed(0)} / ` +
    `${durations[durations.length - 1]?.toFixed(0) ?? '-'}`);
  console.log('─────────────────────────────────────────────');
}

main();
