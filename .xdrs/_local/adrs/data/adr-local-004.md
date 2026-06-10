---
id: adr-local-004
type: ADR
scope: _local
subject: data
title: Anonimização Automática de Dados Jurídicos Antes do Armazenamento
status: active
valid-from: 2026-06-10
authors: [BLAST, SOVEREIGN, BAU, SENTINEL, GHOST, SCOUT, SCRIBE, HERALD]
---

# ADR-LOCAL-004 — Anonimização Automática de Dados Jurídicos

## Contexto

O EAI? Jurídico (Evidence-Based AI) processa casos jurídicos que podem conter nomes de partes, CPFs, endereços,
valores e outras informações pessoais. O sistema já implementa anonimização automática
antes de salvar no Firestore (mencionado no briefing como feature em produção).
Este ADR formaliza o invariante e seus requisitos de implementação.

## Decisão

**Toda persistência de caso jurídico no Firestore passa obrigatoriamente por anonimização
antes do `saveSimulation()`.** Nenhuma exceção. Dados não-anonimizados não chegam ao banco.

## Deliberação da Mesa

**[BLAST]** Dados pessoais em casos jurídicos são toxicidade máxima. A anonimização antes
de salvar é o único modelo aceitável — não anonimizar "depois" ou "quando necessário".
O pipeline correto é: input do usuário → processamento Gemini → anonimização → Firestore.
O dado original nunca persiste.

**[SOVEREIGN]** Complementa BLAST: a anonimização deve ser determinística e reversível
apenas pelo sistema — não pelo usuário e não por consulta direta ao banco. O usuário
fornece o caso com seus dados reais apenas para a sessão ativa; o histórico salvo usa
versão anonimizada. Consentimento coletado nos Termos de Uso (v1.2) cobre este fluxo.

**[BAU]** O log de acesso ao laudo (`laudoAcessadoEm`) já implementa compliance LGPD.
Condição: logs de acesso não devem conter PII — apenas `userId` e `simulationId`.
Qualquer log que contenha descrição do caso deve passar pelo mesmo pipeline de
anonimização.

**[SENTINEL]** Complementa: a anonimização no servidor (backend Express) é a posição
correta — nunca confiar no frontend para anonimizar antes de enviar. O backend valida
e anonimiza independentemente do que o frontend declare ter feito.

**[GHOST]** Tensiona SOVEREIGN: técnicas de re-identificação por correlação de área jurídica,
data e valor podem reconstruir a identidade do usuário mesmo sem PII direta. A anonimização
deve remover ou generalizar campos de alta especificidade (valores exatos, datas precisas,
nomes de cidades pequenas) quando o risco de re-identificação for alto.

**[BLAST]** Cede para GHOST no ponto de re-identificação: o pipeline de anonimização
deve incluir heurística de quasi-identificadores, não apenas substituição de PII óbvia.
Isso é implementação futura — registrada como pendência.

**[SCOUT]** A função de anonimização deve ser unit-testada com corpus de casos reais
anonimizados. Sem cobertura de teste, a garantia é apenas declarativa.

## Invariantes Inegociáveis

1. Anonimização ocorre no servidor antes de qualquer escrita no Firestore
2. Dado original (com PII) não persiste em nenhum storage do sistema
3. Logs de acesso contêm apenas `userId` e `simulationId` — sem descrição do caso
4. A função de anonimização tem cobertura de testes automatizados

## Pendências Registradas

- Heurística de quasi-identificadores para reduzir risco de re-identificação por correlação
- Auditoria do pipeline de anonimização por entidade externa (compliance LGPD)

## Consequências

- Toda nova feature que persiste dados do caso deve passar pelo pipeline de anonimização
- Mudanças na função de anonimização requerem aprovação da Galera de Segurança
- Relatórios de analytics baseados em dados históricos devem usar apenas versão anonimizada

## Assinaturas

```
[BLAST]    Anonimização antes de salvar — invariante absoluto. ✓
[SOVEREIGN] Dado original não persiste. Consentimento coberto nos Termos v1.2. ✓
[BAU]      Logs sem PII. Compliance LGPD registrada. ✓
[SENTINEL] Anonimização no servidor, não no cliente. ✓
[GHOST]    Quasi-identificadores como pendência registrada. ✓
[SCOUT]    Cobertura de testes obrigatória. ✓
[SCRIBE]   Artefato válido. Numeração adr-local-004. Índice atualizado. ✓
[HERALD]   valid-from: 2026-06-10. Sem conflitos. ✓
```
