# Plano de Ação — Correções de Segurança
**Data:** 2026-06-04  
**Seeds ativas:** SOFT_ARCH_001 · ENG_LOGIC_001 · CS_ALG_001 · RESILIENCE_001 · ZEROTRUST_003 · IAM_004 · COMPLIANCE_002 · PRACTICAL_005

---

## Gate obrigatório da Engenharia antes de qualquer linha de código

> **SEED_SOFT_ARCH_001:** "Se adicionar a feature causa fricção, reestruture a lógica existente ANTES da implementação."  
> **SEED_ANON_ENG_LOGIC_001:** "Escreva o teste com falha antes da lógica de implementação."  
> **SEED_CS_ALG_001:** "Corrija antes de otimizar. Legibilidade antes de performance."

Nenhuma correção entra sem teste automatizado. Esse não é negociável.

---

## P0 — CRÍTICO: fazer antes do próximo deploy

> Essas duas correções são regressões ativas. Cada deploy em produção com elas presentes aumenta o raio de explosão.

---

### P0-1 — Remover `GEMINI_API_KEY` do bundle do cliente
**Arquivo:** `lexforum-ai-studio/vite.config.ts:11`  
**Esforço:** 5 minutos  
**Risco da mudança:** Zero — a chave não é usada pelo frontend

**O que fazer:**
```typescript
// REMOVER este bloco inteiro:
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
},
```

**Gate SOFT_ARCH_001:** Não há fricção — é só remoção.  
**Gate ENG_LOGIC_001:** Teste: build de produção não deve conter a string da chave.

**Ação paralela obrigatória:** Revogar a chave atual no Google Cloud e gerar uma nova. A chave esteve exposta em todos os deploys anteriores — não há como saber se já foi coletada. Revogar é parte da correção, não opcional.

---

### P0-2 — Adicionar `helmet()` e `cors()` ao servidor Express
**Arquivo:** `lexforum-ai-studio/server.ts`  
**Esforço:** 30 minutos  
**Risco da mudança:** Baixo — apenas adiciona headers de resposta

**O que fazer:**
```typescript
import helmet from 'helmet';
import cors from 'cors';

// Antes de qualquer rota:
app.use(helmet());
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173' }));
```

**Gate ZEROTRUST_003:** Micro-segmentação começa nos headers. CSP, X-Frame-Options e HSTS são o primeiro ponto de imposição de política.  
**Gate ENG_LOGIC_001:** Teste: resposta de qualquer endpoint deve conter `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`.

---

## P1 — ALTO: implementar esta semana

---

### P1-1 — Autenticação obrigatória nos endpoints de IA
**Arquivo:** `lexforum-ai-studio/server.ts:61-206`  
**Esforço:** 2 horas  
**Risco da mudança:** Médio — quebrará clientes que chamam sem token

**O que fazer:**

Extrair o código já existente na rota Stripe (linhas 273-278) em um middleware reutilizável. Não duplicar lógica.

```typescript
// Novo arquivo: lexforum-ai-studio/src/middleware/requireAuth.ts
import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

Aplicar em todos os endpoints:
```typescript
app.post('/api/gemini/validate', requireAuth, async (req, res) => { ... });
app.post('/api/gemini/simulate', requireAuth, async (req, res) => { ... });
app.post('/api/gemini/report', requireAuth, async (req, res) => { ... });
app.post('/api/counter-hypotheses', requireAuth, async (req, res) => { ... });
app.post('/api/expand-hypothesis', requireAuth, async (req, res) => { ... });
app.post('/api/gemini/mode5', requireAuth, async (req, res) => { ... });
```

**Gate SOFT_ARCH_001:** A lógica de auth já existe na rota Stripe. Extrair é refatoração, não invenção. Não duplicar.  
**Gate ENG_LOGIC_001:** Testes obrigatórios: (a) requisição sem token retorna 401, (b) requisição com token inválido retorna 401, (c) requisição com token válido chega ao handler.  
**Gate ZEROTRUST_003:** Verificação Contínua — o middleware deve revalidar o token a cada requisição, não confiar em sessão prévia.

**Ação no frontend (`gemini.ts`):** Passar o `idToken` do Firebase Auth em todas as chamadas:
```typescript
const token = await auth.currentUser?.getIdToken();
headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
```

---

### P1-2 — Rate limiting nos endpoints de IA
**Arquivo:** `lexforum-ai-studio/server.ts`  
**Esforço:** 1 hora  
**Dependência:** P1-1 (com auth, o limite pode ser por usuário, não só por IP)

**O que fazer:**

```typescript
import rateLimit from 'express-rate-limit';

// Limites diferenciados por tipo de operação
const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,           // 20 validações por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde.' }
});

const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,            // 3 simulações por IP por minuto — cada uma dispara ~8 chamadas ao Gemini
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de simulações atingido. Aguarde.' }
});

app.post('/api/gemini/validate', validateLimiter, requireAuth, ...);
app.post('/api/gemini/simulate', simulateLimiter, requireAuth, ...);
app.post('/api/gemini/mode5', simulateLimiter, requireAuth, ...);
app.post('/api/gemini/report', validateLimiter, requireAuth, ...);
app.post('/api/counter-hypotheses', validateLimiter, requireAuth, ...);
app.post('/api/expand-hypothesis', validateLimiter, requireAuth, ...);
```

**Gate CS_ALG_001 — Análise assintótica do rate limiter:**  
`express-rate-limit` padrão usa store in-memory com Map. Lookup O(1) por chave (IP). Janela deslizante. Correto para single-instance. Se o servidor escalar para múltiplas instâncias no futuro, migrar para Redis store.

**Gate COMPLIANCE_002:** Rate limiting é Monitoramento Contínuo preventivo — não reativo. O `notifySpendingCap` pode continuar como fallback, mas não como única linha de defesa.

---

### P1-3 — Sanitização de path traversal no agent-resolver
**Arquivo:** `lexforum-ai-studio/agent-resolver.ts:104` e `server.ts:104, 121`  
**Esforço:** 30 minutos

**O que fazer:**
```typescript
// agent-resolver.ts — substituir o fs.readFileSync inline por função com allowlist
function safeReadAgentFile(arquivo: string): Record<string, any> {
  const AGENTS_DIR = path.resolve(process.cwd(), 'agents');
  const resolved = path.resolve(AGENTS_DIR, path.basename(arquivo));

  if (!resolved.startsWith(AGENTS_DIR + path.sep)) {
    throw new Error(`Path traversal bloqueado: ${arquivo}`);
  }

  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}
```

**Gate CS_ALG_001 — Prova de correção:**  
`path.basename` extrai apenas o nome do arquivo, removendo qualquer componente de diretório (`../../etc/passwd` → `passwd`). `path.resolve` normaliza o resultado. `startsWith(AGENTS_DIR + sep)` garante confinamento. O algoritmo é O(1) e formalmente correto.

**Gate ENG_LOGIC_001:** Testes: (a) `../../etc/passwd` deve lançar erro, (b) `agents/juiz_civel_001_v1.0.json` deve funcionar normalmente.

---

### P1-4 — Remover logs de dados sensíveis do usuário
**Arquivo:** `lexforum-app/src/app/api/validar/route.ts:93`  
**Esforço:** 5 minutos

```typescript
// REMOVER:
console.error('RAW VALIDAR:', rawText);
```

**Gate IAM_004:** Metadados de identidade jurídica não devem ser persistidos em log não estruturado.

---

### P1-5 — Normalizar mensagens de erro ao cliente
**Arquivo:** `lexforum-ai-studio/server.ts` — múltiplos handlers  
**Esforço:** 20 minutos

```typescript
// Padrão a aplicar em todos os catch:
console.error('[API Error]', { route: req.path, error: error.message });
res.status(500).json({ error: 'Erro interno. Tente novamente.' });
```

**Gate RESILIENCE_001:** Transparência radical com o usuário não significa expor stack trace — significa ser honesto sobre o que aconteceu em linguagem que o usuário entende.

---

### P1-6 — Reduzir limite do body JSON
**Arquivo:** `lexforum-ai-studio/server.ts:31`  
**Esforço:** 5 minutos

```typescript
// DE:
express.json({ limit: '50mb' })(req, res, next);
// PARA:
express.json({ limit: '10mb' })(req, res, next);
```

**Gate CS_ALG_001:** 10MB suporta 2-3 imagens JPEG de alta qualidade ou 1 PDF grande em base64. O raio de explosão de um payload DoS cai de 50MB para 10MB — fator 5 de redução de superfície de exposição.

---

## P2 — MÉDIO: backlog próximo sprint

---

### P2-1 — Corrigir IDOR em `getSimulationById`
**Arquivo:** `lexforum-ai-studio/src/services/dbService.ts:224`  
**Esforço:** 30 minutos

```typescript
export const getSimulationById = async (simulationId: string, requestingUid: string | null) => {
  const snap = await getDoc(doc(db, 'simulations', simulationId));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Permite acesso anônimo apenas a simulações sem dono (userId null)
  if (data.userId && data.userId !== requestingUid) return null;
  return { id: snap.id, ...data };
};
```

Revisar e atualizar todos os call sites para passar o `uid` do usuário autenticado.

---

### P2-2 — Adicionar nomes próprios ao anonymizer
**Arquivo:** `lexforum-ai-studio/src/lib/anonymizer.ts`  
**Esforço:** 1-2 horas (regex de NER é impreciso — avaliar abordagem)

**Gate SOFT_ARCH_001:** Antes de implementar, avaliar se regex é a ferramenta certa. Nomes próprios em português têm alta variabilidade. Considerar: (a) regex de padrões comuns (nome + sobrenome em maiúscula), (b) lista negra de padrões frequentes, (c) delegar anonimização de nomes ao modelo Gemini como pré-processamento.

Exemplo de abordagem conservadora:
```typescript
// Padrão simples: sequência de palavras capitalizadas (2-4 tokens)
{ pattern: /\b([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][a-záéíóúàâêôãõç]+)(\s[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][a-záéíóúàâêôãõç]+){1,3}\b/g, label: '[NOME]' }
```

Isso gerará falsos positivos (nomes de cidades, empresas). Testar exaustivamente antes de ativar.

---

### P2-3 — Limite e autenticação no endpoint SSE
**Arquivo:** `lexforum-ai-studio/simulation-status.ts`  
**Esforço:** 1 hora

```typescript
const MAX_SESSIONS = 500;

router.get('/status/:sessionId', requireAuth, (req, res) => {
  if (sessions.size >= MAX_SESSIONS) {
    res.status(503).json({ error: 'Servidor ocupado. Tente em instantes.' });
    return;
  }
  // ... lógica existente
});
```

Adicionar também TTL por sessão com limpeza periódica:
```typescript
setInterval(() => {
  // Sessions abertas há mais de 10 minutos sem evento 'close' são leaked
  // Implementar com timestamp de criação por sessão
}, 60_000);
```

---

### P2-4 — Verificação server-side de pagamento para o laudo
**Arquivo:** `lexforum-ai-studio/server.ts` — nova rota  
**Esforço:** 2 horas

Criar endpoint `GET /api/laudo/:simulationId` protegido por `requireAuth` que verifica o pagamento server-side antes de retornar o laudo — em vez de depender exclusivamente da verificação client-side via Firestore.

---

## P3 — ESTRUTURAL: decisão arquitetural (discutir antes de implementar)

---

### P3-1 — Unificar os dois sistemas de IA
**Impacto:** Alto  
**Esforço:** 1-2 dias

O projeto tem dois sistemas de IA independentes:
- `lexforum-ai-studio/server.ts` (Express) — sistema principal
- `lexforum-app/src/app/api/` (Next.js) — sistema paralelo

Cada correção de segurança precisa ser aplicada nos dois. Isso é débito técnico arquitetural.

**Gate SOFT_ARCH_001:** "Se adicionar a feature causa fricção, reestruture antes." Manter dois sistemas é fricção contínua.

**Decisão necessária:** Qual sistema é o canônico? Eliminar o outro ou garantir que ambos compartilhem o mesmo middleware de auth e rate limiting.

---

### P3-2 — Pairwise identifiers para simulações
**Impacto:** Alto  
**Esforço:** Estimativa requer análise de todos os call sites

Substituir o `userId` direto nas simulações por um hash `SHA256(uid + salt)` específico para o contexto de simulações. Isso desvincula o identificador de simulação do identificador de autenticação.

**Gate SOFT_ARCH_001:** Mudança estrutural. Requer migração dos documentos existentes no Firestore. Não implementar sem plano de migração e testes de regressão completos.

---

### P3-3 — Firestore Security Rules no repositório
**Impacto:** Fundacional  
**Esforço:** 1 dia

As regras de acesso ao Firestore não estão no repositório. Sem visibilidade das rules, não é possível auditar a proteção de dados em nível de banco.

**Adicionar ao repositório:**
- `firestore.rules` — regras de produção
- `firestore.rules.test.ts` — testes das rules com Firebase Emulator
- CI step para validar as rules a cada PR

---

## Resumo executivo para priorização

```
HOJE (antes do próximo deploy):
  P0-1 — Remover GEMINI_API_KEY do vite.config.ts        [5 min]
  P0-2 — helmet() + cors()                               [30 min]
  ⚠️  Revogar chave Gemini atual e gerar nova              [fora do código]

ESTA SEMANA:
  P1-1 — requireAuth middleware + aplicar nas rotas       [2h]
  P1-2 — Rate limiting diferenciado                       [1h]
  P1-3 — Path traversal sanitization                      [30 min]
  P1-4 — Remover log de dados sensíveis                   [5 min]
  P1-5 — Normalizar erros ao cliente                      [20 min]
  P1-6 — Reduzir body limit para 10mb                     [5 min]

PRÓXIMO SPRINT:
  P2-1 — IDOR em getSimulationById                        [30 min]
  P2-2 — Anonymizer + nomes próprios                      [2h]
  P2-3 — SSE com limite e TTL                             [1h]
  P2-4 — Verificação server-side de pagamento             [2h]

DECISÃO ARQUITETURAL (agendar sessão):
  P3-1 — Unificar os dois sistemas de IA
  P3-2 — Pairwise identifiers
  P3-3 — Firestore Rules no repositório + testes
```

**Total P0+P1:** ~4h de implementação  
**Cobertura de risco eliminada com P0+P1:** ~85% da superfície de exposição crítica

---

## Gate final da Engenharia

**SEED_ANON_ENG_LOGIC_001:** Nenhuma correção entra em produção sem teste automatizado cobrindo o comportamento de segurança esperado. Não existe "o código funciona, não precisa de teste" neste contexto.

**SEED_SOFT_ARCH_001:** Começar pelos P0. Cada P1 deve ser um PR separado com escopo isolado. Mudanças pequenas e verificáveis são mais seguras do que um PR que altera tudo de uma vez.

**SEED_CS_ALG_001:** Os algoritmos críticos (rate limiter, path sanitization, auth middleware) devem ter sua correção formal documentada inline — não como comentário decorativo, mas como prova de que o código faz o que diz fazer.
