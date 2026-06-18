---
id: edr-local-005
type: EDR
scope: _local
subject: devops
title: Expurgo Seguro do Nome "LexForum" — Gates Obrigatórios para Renomeação de Diretório de Produção
status: active
valid-from: 2026-06-18
authors: [SCOUT, FLUX, LITERATE, RIVERRAID, BLAST, BAU, SENTINEL, SOVEREIGN, GHOST, SCRIBE, HERALD]
---

# EDR-LOCAL-005 — Expurgo Seguro do Nome "LexForum"

## Contexto

O projeto foi rebatizado de "LexForum" para "EAI? Jurídico", mas o nome legado
persiste em três camadas de risco distinto:

1. `CLAUDE.md` ("Estado atual") — texto descritivo, lido em toda nova sessão.
2. `lexforum-app/` — diretório morto (Next.js, marketing), confirmado não
   referenciado por nenhum `cloudbuild*.yaml` ou workflow do GitHub Actions,
   e explicitamente excluído via `.gcloudignore`.
3. `lexforum-ai-studio/` — diretório de código de produção real, com o caminho
   hardcoded em 4 arquivos de CI/CD (`cloudbuild.yaml`, `cloudbuild-staging.yaml`,
   `cloudbuild.staging.yaml`, `.github/workflows/deploy-staging.yml`).

ARGUS convocou a Galera do Código e a Galera de Segurança sob mandato de
tolerância zero a risco ("não podemos correr NENHUM risco para este expurgo").
A deliberação produziu tensões resolvidas — notadamente entre FLUX e LITERATE
sobre usar symlink vs. `git mv` atômico na Fase 3 — e gates adicionais que vão
além do plano original. Esta decisão satisfaz os critérios de arquivamento do
edr-local-004: afeta múltiplas partes do sistema (CI/CD, 4 YAMLs, `.gcloudignore`),
e foi resultado de tensão na mesa que exigiu convergência.

## Decisão

O expurgo do nome "LexForum" é executado em 3 fases sequenciais, cada uma
exigindo aprovação humana explícita antes da execução, e nenhuma fase
avança sem os gates definidos abaixo. Produção não é alterada até a Fase 3
ser validada em staging com inspeção manual de log completo.

## Deliberação da Mesa

**[SCOUT]** Histórico imutável (`CHANGELOG.md`, `HEALTH_REPORT_v3.3.0.md`) não é
alterado — são registros de fato, não nomenclatura ativa. Apenas referências
em texto descritivo vivo (`CLAUDE.md`) e caminhos de código ativo são
candidatos a mudança.

**[FLUX]** Para a Fase 3, propôs inicialmente symlink (`lexforum-ai-studio -> eai-app`)
como caminho de menor atrito evolutivo, evitando reescrever os 4 arquivos de CI
de uma vez.

**[LITERATE]** Tensionou: symlinks têm comportamento não-determinístico sob
diferentes resolvedores de bundler/Docker context em Cloud Build — o risco de
um symlink não ser seguido silenciosamente é maior que o custo de atualizar
4 arquivos. **[FLUX] cedeu** — Fase 3 usa `git mv` atômico, não symlink.

**[RIVERRAID]** Abstém — não há geração procedural ou bitmask boundary
envolvidos neste expurgo.

**[BLAST]** Antes de deletar `lexforum-app/`, escanear todo o histórico git
do diretório (`git log --all --full-history -- lexforum-app/`) por segredos
vazados (chaves de API, tokens) — deletar o diretório não erradica o
histórico git. Condição obrigatória para a Fase 2.

**[BAU]** Cada fase exige checklist de release atualizado permanentemente
(`docs/checklist-release.md`) documentando que caminhos legados podem estar
hardcoded em configs de trigger externos ao repositório — isso é uma classe
de risco recorrente, não um incidente único.

**[SENTINEL]** Antes de qualquer mudança na Fase 3, exportar e documentar a
configuração atual dos triggers do Cloud Build no GCP. A mudança de caminho
deve ser validada em staging com inspeção manual do log completo do build
— não apenas o status pass/fail, que pode mascarar falhas parciais
(ex.: build cacheado servindo artefato antigo).

**[SOVEREIGN]** Abstém — não há dados de usuário ou consentimento envolvidos.

**[GHOST]** Mentalidade de atacante: um rename mal sincronizado entre
CI e código é uma janela de oportunidade para deploy de estado inconsistente.
Reforça o requisito de `git mv` atômico em commit único, revertível
independentemente, e propõe proteção de branch no GitHub exigindo o check
de staging como obrigatório antes de merge em `main` — removendo a
dependência de disciplina humana isolada como único controle.

## Invariantes Inegociáveis

1. Nenhuma fase é executada sem aprovação humana explícita prévia.
2. Fase 2 não ocorre sem scan completo do histórico git de `lexforum-app/`
   por segredos vazados.
3. Fase 3 usa `git mv` atômico em commit único — symlink é proibido.
4. Fase 3 exige export documentado da configuração atual dos triggers
   Cloud Build antes de qualquer alteração.
5. Validação de staging na Fase 3 inclui inspeção manual do log completo
   do build — status pass/fail isolado é insuficiente.
6. Testes devem estar verdes antes e depois de cada fase.
7. `docs/checklist-release.md` recebe entrada permanente sobre caminhos
   legados hardcoded em configs de trigger externas.
8. Branch protection em `main` passa a exigir o check de staging antes de merge.
9. Conteúdo histórico (`CHANGELOG.md`, `HEALTH_REPORT_v3.3.0.md`) permanece
   intocado; `adr-local-001.md` tem apenas referências de caminho atualizadas
   se a Fase 3 for executada — sua decisão substantiva permanece válida.

## Consequências

- O expurgo se torna auditável como política, não como tarefa ad-hoc —
  qualquer reversão ou questionamento futuro sobre por que o caminho mudou
  aponta para este documento.
- A Fase 3 é a única com risco residual não-zero (mudança em produção via
  CI); os gates acima reduzem esse risco a um nível que a mesa considerou
  aceitável sob o mandato de tolerância zero, mas a execução real ainda
  depende de validação humana fase a fase.
- Complementa `bdr-local-003` (pipeline staging→produção como portão
  obrigatório) — não a substitui; a Fase 3 deste EDR é um caso de uso
  concreto daquele portão.

## Assinaturas

```
[SCOUT]     Histórico imutável preservado; só nomenclatura ativa muda. ✓
[FLUX]      Cedeu a LITERATE — git mv atômico, não symlink. ✓
[LITERATE]  Risco de resolução de symlink em CI rejeitado. ✓
[RIVERRAID] Fora de jurisdição — abstém. ✓
[BLAST]     Scan de segredos no histórico git antes da Fase 2. ✓
[BAU]       Checklist de release permanente sobre caminhos legados. ✓
[SENTINEL]  Export de triggers + inspeção manual de log antes da Fase 3. ✓
[SOVEREIGN] Sem dados de usuário envolvidos — abstém. ✓
[GHOST]     Commit atômico revertível + branch protection obrigatória. ✓
[SCRIBE]    Artefato válido. Numeração edr-local-005. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-18. Sem conflito — complementa bdr-local-003. ✓
```
