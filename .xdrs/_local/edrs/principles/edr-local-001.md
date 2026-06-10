---
id: edr-local-001
type: EDR
scope: _local
subject: principles
title: Commits Atômicos — Uma Tarefa por Commit, Contexto Completo Antes de Agir
status: active
valid-from: 2026-06-10
authors: [SCOUT, FLUX, LITERATE, PARETO, SCAFFOLD, SCRIBE, HERALD]
---

# EDR-LOCAL-001 — Commits Atômicos

## Contexto

O briefing do projeto registra como regra inegociável: "Commits atômicos — uma tarefa
por commit" e "git log --oneline -3 antes de qualquer tarefa". Este EDR formaliza
essa prática como política de engenharia com critérios objetivos.

## Decisão

Cada commit representa exatamente uma unidade de mudança coerente. O histórico de git
é documentação executável do sistema — cada entrada deve ser legível e revertível
de forma independente.

## Deliberação da Mesa

**[SCOUT]** Um commit por tarefa é a unidade natural de responsabilidade profissional.
Um commit que mistura refatoração + nova feature + correção de bug torna bisect impossível
e code review superficial. A regra não é burocracia — é higiene de engenharia.

**[FLUX]** O histórico limpo é pré-requisito para refatoração segura. Se cada commit
é uma unidade coerente, reverter uma mudança não afeta outra. O `git log` é a narrativa
da evolução do sistema — deve ser legível como prosa.

**[LITERATE]** Complementa FLUX: a mensagem de commit é a primeira documentação da
mudança. O formato deve ser descritivo e consistente. Mensagens como "fix" ou "update"
são narrativa vazia — o leitor não sabe o que foi fixado ou atualizado.

**[PARETO]** A prática de ler o log antes de qualquer tarefa (`git log --oneline -3`)
previne a maior fonte de conflitos: trabalhar sobre estado incorreto do repositório.
80% dos conflitos vêm de não verificar o contexto antes de começar.

**[SCAFFOLD]** Commits atômicos facilitam automação de CI — cada commit pode ser
testado independentemente, e falhas são rastreáveis a uma unidade específica de mudança.

## Critérios Objetivos

Um commit é atômico quando:
- Resolve exatamente uma tarefa ou sub-tarefa identificável
- O build e os testes passam naquele commit de forma isolada
- A mensagem descreve o "o quê" e o "por quê" em uma frase

Um commit NÃO é atômico quando:
- Mistura refatoração com nova funcionalidade
- Inclui mudanças em arquivos não relacionados à tarefa
- A mensagem é genérica ("fix", "update", "wip", "changes")

## Invariantes Inegociáveis

1. Um commit por tarefa — sem commits "guarda-tudo"
2. `git log --oneline -3` executado antes de iniciar qualquer tarefa
3. Mensagem de commit descreve tarefa específica — sem mensagens genéricas
4. Build e testes passam em cada commit de forma isolada

## Consequências

- PRs devem ter commits limpos — squash de WIP antes do merge
- Code review acontece por commit quando a mudança é complexa
- Rollback de feature específica é sempre possível sem risco de regressão colateral

## Assinaturas

```
[SCOUT]    Higiene de engenharia não negociável. ✓
[FLUX]     Histórico como narrativa de evolução. ✓
[LITERATE] Mensagem de commit como primeira documentação. ✓
[PARETO]   git log antes de agir previne maioria dos conflitos. ✓
[SCAFFOLD] Commits atômicos facilitam CI. ✓
[SCRIBE]   Artefato válido. Numeração edr-local-001. Índice atualizado. ✓
[HERALD]   valid-from: 2026-06-10. Sem conflitos. ✓
```
