# Revisão de Segurança — EAI? / LexForum
**Data:** 2026-06-04  
**Branch:** `claude/code-security-review-wTYMl`  
**Seeds ativas:** RESILIENCE_001 · COMPLIANCE_002 · ZEROTRUST_003 · IAM_004 · PRACTICAL_005

---

## Resumo executivo

A revisão cobriu os dois módulos do repositório (`lexforum-ai-studio` e `lexforum-app`). Foram identificadas **3 vulnerabilidades críticas**, **4 de alto impacto**, **5 médias** e **1 baixa**. A combinação de chave de API exposta no bundle e ausência de rate limiting representa o risco mais imediato: é suficiente para esgotamento de spending cap em minutos.

---

## Gate: SEED_ANON_SEC_ZEROTRUST_003 — Verificação Contínua / Negação Implícita

### [C2] CRÍTICO — Endpoints de IA sem autenticação
**Arquivo:** `lexforum-ai-studio/server.ts` linhas 61–206  
**Endpoints afetados:**
- `POST /api/gemini/validate`
- `POST /api/gemini/simulate`
- `POST /api/gemini/report`
- `POST /api/counter-hypotheses`
- `POST /api/expand-hypothesis`
- `POST /api/gemini/mode5`

Nenhum destes endpoints verifica token de autenticação. A única rota protegida é `/api/stripe/create-checkout-session` (linha 273). Qualquer requisição HTTP anônima aciona processamento real na API Gemini, gerando custo e consumindo cota.

**Gate violado:** "Execute complete authentication, authorization, and posture assessment before granting least privilege access."

**Correção:** Extrair o middleware de autenticação já existente na rota Stripe (`admin.auth().verifyIdToken(token)`) em uma função reutilizável e aplicá-lo a todos os endpoints de IA.

```typescript
// middleware a criar
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.uid = (await admin.auth().verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

---

### [M5] MÉDIO — CORS não configurado explicitamente
**Arquivo:** `lexforum-ai-studio/server.ts`

Sem `cors()` middleware, qualquer origem pode chamar a API em produção. O Express não bloqueia por padrão.

**Correção:** Adicionar `cors({ origin: process.env.APP_URL })` antes das rotas.

---

## Gate: SEED_ANON_SEC_RESILIENCE_001 — Superfície de Exposição / Raio de Explosão

### [C1] CRÍTICO — GEMINI_API_KEY injetada no bundle do cliente
**Arquivo:** `lexforum-ai-studio/vite.config.ts` linha 11

```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
},
```

O Vite compila este valor literalmente dentro do JavaScript que é enviado ao navegador. Qualquer usuário pode abrir DevTools → Sources, buscar pela chave e encontrá-la em texto plano. Com a chave, a pessoa faz chamadas diretas à API Gemini, custando dinheiro ao projeto.

O módulo cliente (`gemini.ts`) **não usa** a chave — todas as chamadas já passam pelo servidor Express. A linha no `vite.config.ts` é um passivo de dados sem utilidade funcional.

**Gate violado:** "Verify if the operational utility outweighs the liability risk; if negative, reject."

**Correção:** Remover o bloco `define` inteiramente do `vite.config.ts`.

---

### [C3] CRÍTICO — Ausência total de rate limiting
**Arquivo:** `lexforum-ai-studio/server.ts`

Nenhum endpoint possui rate limiting. Um único script pode disparar centenas de requisições simultâneas, cada uma disparando múltiplas chamadas ao Gemini (até 3 rodadas + brief + report = ~8 chamadas por simulação). O `notifySpendingCap` é reativo — alerta depois que o orçamento foi consumido.

**Raio de explosão:** Um ataque de 100 req/min × 8 chamadas = 800 chamadas/min ao Gemini.

**Gate violado:** "Blast radius is directly proportional to its data retention policy" — aqui ao mecanismo de throttling.

**Correção:** Adicionar `express-rate-limit` com limites diferenciados:

```typescript
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minuto
  max: 5,                  // 5 simulações por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/gemini/simulate', aiLimiter, ...);
app.post('/api/gemini/validate', aiLimiter, ...);
// etc.
```

---

### [A3] ALTO — Limite de 50MB no corpo da requisição
**Arquivo:** `lexforum-ai-studio/server.ts` linha 31

```typescript
express.json({ limit: '50mb' })(req, res, next);
```

Imagens e PDFs são enviados como base64 inline, ampliando o tamanho real em ~33%. Um atacante pode enviar payloads de 50MB repetidamente, esgotando memória do processo Node.js.

**Correção:** Reduzir para `10mb` (suficiente para 2-3 imagens de qualidade média) e validar tamanho de cada anexo individualmente no payload.

---

### [M2] MÉDIO — Mensagens de erro internas expostas ao cliente
**Arquivo:** `lexforum-ai-studio/server.ts` linhas 71, 174, 190, 205 e outros

```typescript
res.status(500).json({ error: error.message || "Unknown error" });
```

`error.message` pode conter stack traces, caminhos de arquivo, nomes de variáveis de ambiente — informação que orienta um atacante sobre a arquitetura interna.

**Correção:** Logar o erro completo no servidor e retornar apenas mensagem genérica ao cliente:
```typescript
console.error('[API Error]', error);
res.status(500).json({ error: 'Erro interno. Tente novamente.' });
```

---

### [M3] MÉDIO — Log de dados jurídicos sensíveis do usuário
**Arquivo:** `lexforum-app/src/app/api/validar/route.ts` linha 93

```typescript
console.error('RAW VALIDAR:', rawText);
```

A resposta bruta do modelo contém um resumo da causa jurídica do usuário. Esse dado pode incluir informações pessoais identificáveis (nomes, valores, situações). Logs de servidor são persistidos e acessíveis a infraestrutura.

**Correção:** Remover o `console.error` de produção (ou movê-lo para condicional `if (process.env.NODE_ENV !== 'production')`).

---

## Gate: SEED_ANON_SEC_IAM_004 — Minimal Disclosure / Self-Sovereignty

### [A1] ALTO — IDOR em getSimulationById
**Arquivo:** `lexforum-ai-studio/src/services/dbService.ts` linha 224

```typescript
export const getSimulationById = async (simulationId: string) => {
  const snap = await getDoc(doc(db, 'simulations', simulationId));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};
```

Nenhuma verificação de propriedade. Usuário A pode acessar a simulação do Usuário B fornecendo o ID correto. IDs do Firestore são UUIDs (difíceis de adivinhar), mas isso é segurança por obscuridade — não controle de acesso real.

**Gate violado:** "Deploy unique pairwise identifiers per service to prevent cross-tracking" + "Release minimal attributes necessary."

**Correção:**
```typescript
export const getSimulationById = async (simulationId: string, requestingUid: string) => {
  const snap = await getDoc(doc(db, 'simulations', simulationId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.userId && data.userId !== requestingUid) return null; // nega acesso
  return { id: snap.id, ...data };
};
```

Complementar com Firestore Security Rule:
```
match /simulations/{simId} {
  allow read: if request.auth != null && 
              (resource.data.userId == request.auth.uid || resource.data.userId == null);
}
```

---

### [M4] MÉDIO — Verificação de pagamento apenas no cliente
**Arquivo:** `lexforum-ai-studio/src/services/dbService.ts` linha 148

`hasUserPaidForSession` lê diretamente do Firestore no browser. A segurança depende 100% das Firestore Security Rules. Se as regras estiverem permissivas (ou ausentes), qualquer usuário poderia modificar seu próprio documento de pagamento via Console do Firebase.

**Recomendação:** Adicionar verificação server-side antes de entregar o laudo (semelhante ao que já existe no checkout Stripe: `simSnap.data()?.userId !== uid → 403`).

---

## Gate: SEED_ANON_SEC_PRACTICAL_005 — Fator Humano / Attacker Mindset

### [A2] ALTO — Path Traversal latente no agent-resolver
**Arquivo:** `lexforum-ai-studio/agent-resolver.ts` linha 104 / `server.ts` linhas 104, 121

```typescript
const agentJson = entry.conteudo ?? JSON.parse(
  fs.readFileSync(path.join(process.cwd(), entry.arquivo), 'utf-8')
);
```

`entry.arquivo` vem de dados no Firestore (`agents` collection). Se um atacante obtiver acesso de escrita ao Firestore (via credencial comprometida ou regra permissiva), pode modificar `entry.arquivo` para `../../etc/passwd` ou `../../.env`.

**Vetor de ataque:** comprometer um agente no Firestore → injetar path traversal → servidor lê arquivo arbitrário.

**Correção:** Sanitizar o caminho com uma allowlist:
```typescript
const SAFE_DIR = path.join(process.cwd(), 'agents');
const resolved = path.resolve(SAFE_DIR, path.basename(entry.arquivo));
if (!resolved.startsWith(SAFE_DIR)) throw new Error('Path traversal bloqueado');
```

---

### [A4] ALTO — Ausência de headers de segurança HTTP
**Arquivo:** `lexforum-ai-studio/server.ts`

Sem `helmet.js` ou headers equivalentes, a aplicação está exposta a:
- **XSS** — sem `Content-Security-Policy`
- **Clickjacking** — sem `X-Frame-Options`
- **MIME sniffing** — sem `X-Content-Type-Options`
- **Protocol downgrade** — sem `Strict-Transport-Security`

**Correção:** `npm install helmet` + `app.use(helmet())` antes das rotas.

---

### [M1] MÉDIO — SSE sessions Map sem limite e sem validação
**Arquivo:** `lexforum-ai-studio/simulation-status.ts` linha 27

```typescript
const sessions = new Map<string, Response>();

router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  sessions.set(sessionId, res);
  // ...
});
```

Sem autenticação e sem limite de sessões. Um atacante pode abrir milhares de conexões SSE mantidas abertas, crescendo o `sessions` Map indefinidamente e esgotando memória.

**Correção:** Validar autenticação no endpoint SSE e limitar número máximo de sessões por IP.

---

## Gate: SEED_ANON_SEC_COMPLIANCE_002 — Monitoramento Contínuo / BAU

### [B1] BAIXO — Firebase client config em arquivo JSON versionado
**Arquivo:** `lexforum-ai-studio/src/firebase-applet-config.json` (referenciado em `firebase.ts:17`)

Firebase client keys são projetadas para ser semi-públicas, mas devem ser protegidas por Firestore Security Rules, não por obscuridade. A ausência de rules documentadas no repositório impede auditoria contínua.

**Recomendação:** Adicionar `firestore.rules` ao repositório e incluir validação das rules no pipeline CI.

---

## Priorização de implementação

| # | Severidade | Item | Esforço |
|---|-----------|------|---------|
| 1 | CRÍTICO | Remover `GEMINI_API_KEY` do `vite.config.ts` | 5 min |
| 2 | CRÍTICO | Adicionar `helmet()` + `cors()` + `express-rate-limit` | 30 min |
| 3 | CRÍTICO | Autenticação obrigatória em todos os endpoints de IA | 1h |
| 4 | ALTO | Sanitização de path traversal em `agent-resolver.ts` | 30 min |
| 5 | ALTO | Corrigir IDOR em `getSimulationById` | 30 min |
| 6 | ALTO | Reduzir limite JSON para 10mb | 5 min |
| 7 | MÉDIO | Remover log de dados do usuário em `validar/route.ts` | 5 min |
| 8 | MÉDIO | Normalizar mensagens de erro ao cliente | 15 min |
| 9 | MÉDIO | Limite e autenticação no endpoint SSE | 30 min |
| 10 | MÉDIO | Verificação server-side de pagamento para laudo | 1h |

**Esforço total estimado: ~5 horas para itens 1-9.**

---

## O que está bem

- Webhook Stripe com verificação de assinatura criptográfica (`constructWebhookEvent`) — correto.
- Checkout Stripe com autenticação Firebase e ownership check da simulação — correto.
- Módulo `anonymizer.ts` aplicado antes de persistir dados no Firestore — correto.
- `gemini.ts` (cliente) usa apenas chamadas HTTP ao servidor, sem acesso direto à API — correto.
- `expandHypothesisServer` tem sanitização parcial contra prompt injection — presente, embora incompleta.
- Persistência de sessão configurável (remember-me) — correto.

---

*Revisão realizada em conformidade com os decision gates das seeds:*  
*SEED_ANON_SEC_RESILIENCE_001 · SEED_ANON_SEC_COMPLIANCE_002 · SEED_ANON_SEC_ZEROTRUST_003 · SEED_ANON_SEC_IAM_004 · SEED_ANON_SEC_PRACTICAL_005*
