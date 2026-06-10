---
id: bdr-local-003
type: BDR
scope: _local
subject: product
title: Pipeline Staging → Produção como Portão Obrigatório para Releases
status: active
valid-from: 2026-06-10
authors: [SCOUT, FLUX, BAU, SENTINEL, PARETO, PROBE, SCAFFOLD, COMPASS, SCRIBE, HERALD]
---

# BDR-LOCAL-003 — Pipeline Staging → Produção Obrigatório

## Contexto

O projeto tem dois ambientes Cloud Run: `eai-staging` e `eai-producao`. O deploy é
automatizado via Cloud Build (`cloudbuild.yaml` para produção, `cloudbuild-staging.yaml`
para staging). O padrão é: feature em branch → validação em staging → merge em main
→ deploy automático em produção.

## Decisão

**Nenhuma feature chega a produção sem validação prévia em staging.** O pipeline
staging → produção é o único caminho de release autorizado. Deploy direto em produção
é proibido exceto em incidente crítico declarado.

## Deliberação da Mesa

**[SCOUT]** O staging é o ambiente de validação real — não apenas de smoke test.
A validação deve cobrir o golden path completo da feature (fluxo de pagamento, simulação,
chat) antes do merge em main. Aprovação implícita ("funcionou no meu local") não é
validação de staging.

**[FLUX]** O pipeline de deploy automático via Cloud Build é a implementação correta
do princípio de entrega contínua. Condição: o arquivo `cloudbuild.yaml` de produção
nunca deve incluir steps de teste que podem falhar silenciosamente — falha deve
interromper o pipeline.

**[BAU]** Staging e produção têm configurações distintas (Stripe test vs live, Gemini
keys distintas). A separação de configuração deve ser verificada antes de cada release
— um script ou checklist documentado. Deploy de produção com chave de staging é
incidente de segurança.

**[SENTINEL]** Complementa BAU: as variáveis de ambiente de produção nunca aparecem em
logs de build ou outputs do Cloud Build. O `cloudbuild.yaml` deve usar Secret Manager
para injetar secrets — nunca inline.

**[PARETO]** A validação em staging deve priorizar os fluxos de maior risco: pagamento,
autenticação e geração de laudo. Esses três fluxos concentram a maior densidade de
defeitos potenciais e impacto de negócio.

**[PROBE]** Staging deve ser validado com sessão exploratória de pelo menos 15 minutos
antes de merge em main. A validação não é apenas "clica no botão" — é exploração ativa
de edge cases: pagamento cancelado, sessão expirada, Gemini timeout, quota excedida.

**[SCAFFOLD]** Os testes automatizados com Vitest devem passar em staging antes de
qualquer merge. A ausência de testes verdes não é "ok para seguir" — é bloqueio de merge.

**[COMPASS]** O botão de deploy em staging deve ser distinto visualmente do de produção
em qualquer dashboard de CI. Confundir os dois é risco real de operação.

## Invariantes Inegociáveis

1. Toda feature passa por staging antes de produção — sem exceções em condições normais
2. Testes automatizados passando é pré-requisito de merge em main
3. Chaves de produção (Stripe live, Gemini prod) nunca em staging
4. Secrets de produção via Secret Manager — nunca inline no cloudbuild.yaml
5. Sessão exploratória documentada antes de cada merge em main

## Exceção de Incidente Crítico

Em caso de incidente crítico em produção (dados inacessíveis, pagamentos falhando,
falha de segurança), deploy direto em produção é autorizado com:
- Registro de incidente antes do deploy
- Revisão post-mortem obrigatória em 48h
- Comunicação ao time

## Consequências

- Branches de feature devem ser testadas em staging antes de qualquer PR para main
- O checklist de release deve ser documentado e seguido a cada deploy
- Hotfixes seguem a exceção de incidente com documentação obrigatória

## Assinaturas

```
[SCOUT]    Validação real de staging, não smoke test. ✓
[FLUX]     Pipeline de CI não pode falhar silenciosamente. ✓
[BAU]      Checklist de separação de configuração obrigatório. ✓
[SENTINEL] Secrets via Secret Manager — sem inline. ✓
[PARETO]   Foco em pagamento, auth e laudo como fluxos prioritários. ✓
[PROBE]    Sessão exploratória de 15min antes de merge. ✓
[SCAFFOLD] Testes verdes como pré-requisito de merge. ✓
[COMPASS]  Distinção visual de ambientes no dashboard de CI. ✓
[SCRIBE]   Artefato válido. Numeração bdr-local-003. Índice atualizado. ✓
[HERALD]   valid-from: 2026-06-10. Sem conflitos. ✓
```
