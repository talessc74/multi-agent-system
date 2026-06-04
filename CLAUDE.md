# Governance System — Engineering Council

---

## Arquitetura do sistema

### O que está em produção

**Uma única aplicação:** `lexforum-ai-studio`

Deploy via Google Cloud Build → Google Cloud Run:
- Serviço: `eai-producao`
- Região: `us-east1`
- Projeto GCP: `gen-lang-client-0982741688`
- Imagem: `gcr.io/gen-lang-client-0982741688/eai-producao`
- Pipeline: `cloudbuild.yaml` na raiz do repositório

**O que entra no build de produção:**

| Diretório | Como entra |
|-----------|-----------|
| `lexforum-ai-studio/` | Dockerfile direto |
| `agents/` | Copiado em build time pelo cloudbuild.yaml |
| `registry/` | Copiado em build time pelo cloudbuild.yaml |

**Stack ativa:** Vite + React (frontend) · Express (backend) · Gemini API · Firebase/Firestore · Stripe

---

### O que está arquivado

**`_archived/lexforum-app/`** — protótipo Next.js descontinuado

Era uma direção tecnológica diferente (Next.js + Anthropic Claude + Supabase) que foi
abandonada antes de entrar em produção. Nunca teve deploy ativo. Arquivado em 2026-06-04.
Histórico git preservado em `_archived/lexforum-app/`.

---

## Instrução obrigatória

Este projeto opera sob um sistema de seeds de governança distribuído
em três equipes: Engenharia, UX e Segurança.

Antes de iniciar qualquer tarefa, leia integralmente:
  .seeds/ORCHESTRATOR.md

O Orchestrator define quais seeds são ativadas para cada tipo de tarefa
e a ordem de validação obrigatória.

## Regra absoluta

Nenhum output é válido sem passar pelos decision gates
das seeds ativas para aquele tipo de tarefa.

## Seeds disponíveis

### Engenharia
- .seeds/SEED_ANON_ENG_LOGIC_001.json
- .seeds/SEED_SOFT_ARCH_001.json
- .seeds/SEED_CS_ALG_001.json

### UX
- .seeds/SEED_HCD_001.json
- .seeds/SEED_USABX_001.json
- .seeds/SEED_POLAR_BEAR_001.json

### Segurança
- .seeds/SEED_ANON_SEC_RESILIENCE_001.json
- .seeds/SEED_ANON_SEC_COMPLIANCE_002.json
- .seeds/SEED_ANON_SEC_ZEROTRUST_003.json
- .seeds/SEED_ANON_SEC_IAM_004.json
- .seeds/SEED_ANON_SEC_PRACTICAL_005.json
