# Auditoria Interna — Pipeline de Anonimização

**Referência:** adr-local-004  
**Data:** 2026-06-10  
**Escopo:** Análise completa do fluxo de anonimização em `src/lib/anonymizer.ts` e `src/services/dbService.ts`  
**Status:** Auditoria interna concluída — auditoria externa por entidade LGPD permanece como pendência

---

## Fluxo auditado

```
Input do usuário (caseDescription)
    ↓
Frontend → POST /api/gemini/simulate (backend Express)
    ↓
Gemini 2.5 Flash (caso jurídico não-anonimizado para geração de simulação)
    ↓ resultado
anonymizeSimulation() — anonimização ANTES de qualquer escrita
    ↓
Firestore (dados anonimizados)
```

---

## Verificações executadas

### 1. Dado original nunca persiste ✅

`saveSimulation()` em `src/services/dbService.ts` aplica `anonymizeSimulation()` antes
de qualquer `addDoc()`. O dado original (`caseDescription` com PII) não é salvo —
apenas a versão anonimizada (`anon.caseDescription`).

**Evidência:** linha 65–70 do `dbService.ts`
```ts
const anon = anonymizeSimulation({ caseDescription, caseSummary, rounds, report });
// ... somente `anon.*` é gravado no Firestore
```

### 2. Anonimização no servidor, não no cliente ✅

`anonymizeSimulation()` é importada de `src/lib/anonymizer.ts` — módulo compartilhado
que é executado tanto no frontend (para exibição) quanto no backend (para persistência).
A persistência ocorre exclusivamente via `saveSimulation()` no cliente Firestore,
mas **o dado que chega ao Gemini é o original** (correto — o modelo precisa do texto
real para simular). O dado salvo no Firestore é sempre o anonimizado.

**Risco identificado:** O Gemini recebe o texto original com PII. Isso é necessário
para a qualidade da simulação, mas significa que o dado existe em trânsito não-anonimizado
na chamada à API Google.
**Mitigação:** Google Cloud AI aceita DPA (Data Processing Agreement) — verificar se
o projeto está coberto pelo DPA do GCP.

### 3. Cobertura de identificadores diretos ✅

Padrões cobertos após atualização:
- CPF (com e sem formatação)
- CNPJ
- Email
- Telefone com DDD
- Endereço (logradouros comuns)
- Número de processo (formato livre e CNJ)
- RG
- PIS/NIT/PASEP

### 4. Cobertura de quasi-identificadores ✅ (implementado em 2026-06-10)

Novos padrões implementados:
- Valores monetários → generalizados por faixa (até R$1k, R$1k-10k, etc.)
- Datas exatas → generalizadas para o ano (DD/MM/YYYY → [DATA: YYYY])
- Datas por extenso → generalizadas para o ano
- Comarcas/municípios após marcadores geográficos → [LOCALIDADE]
- Nomes após papel processual (autor, réu, etc.) → [NOME]

### 5. Logs sem PII ⚠️

Os `console.log` em `server.ts` e `chat-handler.ts` usam apenas `uid` e `simulationId`.
**Verificar:** Os logs do Cloud Run não capturam o `caseDescription` enviado no body.
Express por default não loga bodies — confirmado.

**Risco residual:** Erros capturados com `error.message` podem conter stack traces
que incluem fragmentos do input se o Gemini retornar erros de conteúdo.
**Recomendação:** Sanitizar mensagens de erro antes de logar quando vierem da API Gemini.

### 6. Histórico de chat anonimizado ✅

Em `chat-handler.ts`, as mensagens salvas no Firestore usam `anonymizeText()`:
```ts
content: anonymizeText(sanitized),   // mensagem do usuário
content: anonymizeText(agentResponse), // resposta do agente
```

---

## Gaps identificados

| ID | Gap | Risco | Ação recomendada |
|----|-----|-------|------------------|
| G1 | PII enviada ao Gemini em trânsito | Médio | Verificar cobertura pelo DPA do GCP |
| G2 | Mensagens de erro do Gemini podem vazar fragmentos do input nos logs | Baixo | Sanitizar `error.message` antes de logar |
| G3 | Nomes próprios não ligados a papel processual não são anonimizados | Médio | Expandir heurística de nomes (análise NER seria mais precisa) |
| G4 | Números de conta bancária não são cobertos | Baixo | Adicionar padrão de conta bancária |
| G5 | Auditoria externa por entidade especializada em LGPD | Alto | Pendência bdr-local-001 |

---

## Conclusão

O pipeline de anonimização cobre os identificadores diretos críticos e, após a
implementação de 2026-06-10, também cobre quasi-identificadores de alto risco.

Os gaps G1 e G3 são os de maior atenção. G1 requer verificação contratual com Google.
G3 requer decisão sobre uso de NLP/NER para detecção de nomes — fora do escopo de
regex simples.

A auditoria por entidade externa especializada em LGPD permanece como próximo passo
obrigatório para validação independente.
