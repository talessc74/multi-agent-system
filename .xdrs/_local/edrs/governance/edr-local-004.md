---
id: edr-local-004
type: EDR
scope: _local
subject: governance
title: ARGUS + XDRS como Protocolo Canônico de Decisão de Engenharia
status: active
valid-from: 2026-06-10
authors: [SCRIBE, HERALD, SCOUT, FLUX, LITERATE, PARETO, SCRIBE, HERALD]
---

# EDR-LOCAL-004 — Governança ARGUS + XDRS como Protocolo de Decisão

## Contexto

O projeto adota o sistema de governança ARGUS + XDRS a partir de 10/06/2026.
Este EDR formaliza como o sistema deve ser usado, quem pode criar policies, e o
que constitui uma decisão que merece ser arquivada.

## Decisão

Toda decisão de engenharia com impacto duradouro é registrada como artefato XDRS
produzido por deliberação ARGUS. Decisões locais ficam em `.xdrs/_local/`. O sistema
de governança não é burocracia opcional — é o mecanismo pelo qual o projeto mantém
consistência e memória institucional.

## Deliberação da Mesa

**[SCRIBE]** Uma decisão merece ser arquivada quando satisfaz ao menos um destes critérios:
(1) afeta múltiplas partes do sistema,
(2) não é óbvia e requer justificativa explícita,
(3) tem consequências que persistem além da sprint atual,
(4) foi resultado de tensão na mesa que precisou de convergência.
Decisões triviais (nomes de variáveis, formatação) não geram XDRS.

**[HERALD]** O `valid-from` de um XDRS é a data de validação pelo humano — não a data
de deliberação. Policies retroativas (documentando decisões já implementadas) têm
`valid-from` na data do arquivamento, não na data da implementação original.
O campo `status` tem três valores válidos: `active`, `superseded`, `removed`.

**[SCOUT]** O protocolo ARGUS não desacelera o desenvolvimento — ele previne retrabalho.
Uma deliberação de 20 minutos evita semanas de refatoração por decisão não documentada.
A mesa deve ser convocada antes da implementação, não depois.

**[FLUX]** Policies são código — podem ser atualizadas. Quando o contexto muda e uma
decisão arquivada não é mais válida, ela deve ser superseded por nova deliberação,
não ignorada. Uma policy `active` que contradiz a prática atual é pior que nenhuma policy.

**[LITERATE]** A narrativa de cada XDRS deve ser compreensível por qualquer membro futuro
do projeto. O leitor não tem o contexto da deliberação original — a justificativa
deve ser autocontida.

**[PARETO]** Prioridade de deliberação: features de pagamento e segurança primeiro,
melhorias de UX e otimizações depois. 80% do risco concentra-se em 20% das decisões.

## Critérios para Abertura de Mesa ARGUS

Abrir mesa quando:
- Nova feature impacta fluxo de pagamento, autenticação ou dado do usuário
- Mudança arquitetural afeta mais de dois módulos
- Há conflito de abordagem entre membros do time
- Uma decisão tomada anteriormente precisa ser revisada

Não abrir mesa quando:
- A decisão é coberta por uma policy XDRS existente
- É uma tarefa de implementação dentro de uma decisão já tomada

## Invariantes Inegociáveis

1. Toda nova decisão arquitetural, de produto ou de engenharia com impacto duradouro
   gera um artefato XDRS
2. SCRIBE estrutura, HERALD valida timing — humano aprova antes de salvar
3. Uma policy `active` nunca é silenciada — é superseded ou removida via nova deliberação
4. ARGUS é convocado antes da implementação, não como documentação post-mortem

## Consequências

- O índice XDRS é atualizado a cada nova policy por SCRIBE
- Onboarding de novos membros começa pela leitura de `.xdrs/_local/`
- Revisão periódica (trimestral) de policies ativas para verificar validade

## Assinaturas

```
[SCOUT]    Mesa antes da implementação — previne retrabalho. ✓
[FLUX]     Policies são código — atualizadas, não ignoradas. ✓
[LITERATE] Narrativa autocontida para leitores futuros. ✓
[PARETO]   Prioridade de deliberação por risco. ✓
[SCRIBE]   Critérios de arquivamento definidos. Numeração edr-local-004. Índice atualizado. ✓
[HERALD]   valid-from semântica definida. Status: active/superseded/removed. ✓
```
