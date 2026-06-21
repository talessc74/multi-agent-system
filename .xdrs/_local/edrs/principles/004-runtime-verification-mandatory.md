---
name: _local-edr-policy-009-runtime-verification-mandatory
description: Torna obrigatória a verificação real em runtime — rodar a aplicação e observar comportamento — antes de qualquer implementação ser considerada concluída. Use antes de declarar qualquer tarefa de implementação concluída.
apply-to: Todos os agentes de IA e contribuidores trabalhando neste repositório
valid-from: 2026-06-21
---

# _local-edr-policy-009: Runtime Verification Mandatory

## Context and Problem Statement

Typecheck e suíte de testes unitários passando comprovam que o código
compila e que as suposições do próprio autor sobre o comportamento se
confirmam isoladamente — não que a funcionalidade funciona de fato. Antes da
implementação do anomaly guard (item 1 do backlog de escalabilidade), surgiu
a pergunta direta: a Galera de QA estava de fato validando, ou só observando
metadados de build? A resposta honesta foi que nenhuma verificação em
runtime tinha ocorrido até ser explicitamente executada — boot do servidor
local, requisições HTTP reais contra os endpoints afetados, observação de
status codes e corpos de resposta reais nos limites exatos do rate limiter.

## Decision Outcome

**Convocar a Galera de QA em uma tarefa de implementação significa, no
mínimo, rodar a aplicação e observar o comportamento real na superfície
afetada — nunca apenas typecheck ou suíte de testes unitários.**

### Details

- Nenhuma tarefa de implementação é considerada concluída sem que a
  superfície de runtime afetada (servidor HTTP, CLI, UI) tenha sido
  efetivamente exercitada, com evidência concreta reportada (status code,
  corpo de resposta, captura de tela, output de terminal) — não apenas a
  leitura do código.
- `npx tsc --noEmit` e `npx vitest run` continuam obrigatórios antes de
  qualquer commit, mas são complementares à verificação em runtime, nunca
  substitutos dela.
- Sem skill `verifier-*` específico no repositório, usar cold-start: ler
  `package.json` para os scripts de boot (`dev`/`start`), montar o ambiente
  mínimo necessário (`.env` local com credenciais sintéticas — nunca reais,
  nunca commitado) e exercitar a superfície real.
- O alvo da verificação é a superfície que a mudança efetivamente afeta —
  esta policy não exige re-execução de uma bateria de regressão completa a
  cada tarefa.

## Consequências

- Formaliza, como prática obrigatória e não pontual, o método já aplicado
  na verificação do anomaly guard (item 1).
- Complementa o ADR `_local-adr-policy-006-galera-de-qa`, que registra a
  composição da Galera de QA responsável por esta convocação.
- CLAUDE.md ganha uma nova Regra absoluta referenciando esta policy —
  versão 1.1.0 → 1.1.1.

## Verificação de integridade

Conferido em 2026-06-21 (papel Scribe + Herald): sem colisão de numeração
global (`_local-edr-policy-009` livre) e sem conflito semântico com as
policies existentes que mencionam "runtime" (EDR-005, EDR-007,
EDR-008-deployment-strategy tratam de contextos distintos — variáveis de
ambiente e override de prompt do agente, não verificação de implementação).

Achado lateral, pré-existente e fora do escopo desta policy: dois EDRs
diferentes (`application/004-demand-driven-agent-creation` e
`devops/001-deployment-strategy`) reivindicam o mesmo número global `008` —
pendente de lint futuro do Scribe.
