---
id: bdr-local-001
type: BDR
scope: _local
subject: principles
title: LGPD como Princípio Inegociável de Produto — Consentimento, Minimização e Direitos do Titular
status: active
valid-from: 2026-06-10
authors: [SOVEREIGN, BLAST, BAU, GHOST, COMPASS, SCRIBE, HERALD]
---

# BDR-LOCAL-001 — LGPD como Princípio de Produto

## Contexto

O EAI? opera no Brasil, processa dados pessoais de pessoas físicas em contexto jurídico
(dados sensíveis por natureza, art. 11 LGPD), e cobra por seus serviços. A base legal
de tratamento é o **consentimento** (art. 7º, I) formalizado nos Termos de Uso v1.2
com timestamp gravado no Firestore.

## Decisão

A conformidade com a LGPD não é feature opcional — é condição de operação. O produto
é arquitetado para minimizar coleta, maximizar controle do titular e facilitar exercício
de direitos (acesso, correção, exclusão, portabilidade).

## Deliberação da Mesa

**[SOVEREIGN]** Os Termos de Uso v1.2 com timestamp registrado por `userId` no Firestore
estabelecem o consentimento documentado. Condição: o aceite deve ser granular — usuário
deve consentir separadamente com: (a) tratamento de dados do caso para simulação, (b)
armazenamento do histórico anonimizado, (c) marketing se aplicável. Consentimento único
para tudo é violação do princípio de granularidade (art. 8º LGPD).

**[BLAST]** Dados coletados no EAI? devem obedecer estrito princípio de minimização:
apenas o necessário para a simulação. Campos opcionais não devem ser pré-preenchidos
nem sugeridos. O produto não deve ser monetizado via dados do usuário — apenas via
serviço prestado.

**[BAU]** LGPD exige resposta a pedidos de titular (art. 18) em prazo definido.
O produto deve ter processo documentado para: acesso ao dado, correção, exclusão e
portabilidade. A ausência de processo documentado é risco regulatório independentemente
da implementação técnica.

**[GHOST]** Dados jurídicos são altamente sensíveis — casos de divórcio, disputas
trabalhistas, crimes. Um vazamento cria risco real para os titulares além do risco de
negócio. A política de resposta a incidente deve incluir notificação à ANPD e ao titular
nos prazos legais (72h para ANPD, prazo razoável para titular).

**[COMPASS]** O aceite de termos não deve ser dark pattern — botão de recusa deve ser
tão visível quanto o de aceite. UX que obscurece recusa viola o espírito do consentimento
livre (art. 8º LGPD).

## Invariantes Inegociáveis

1. Base legal de tratamento é o consentimento documentado — sem tratamento sem aceite
2. Consentimento granular: simulação, histórico e marketing são consentimentos separados
3. Processo documentado para exercício de direitos do titular (acesso, exclusão, portabilidade)
4. Plano de resposta a incidente inclui notificação à ANPD (72h) e ao titular
5. UI de aceite de termos sem dark patterns

## Pendências Registradas

- Revisão da granularidade do aceite atual (Termos v1.2) por jurista LGPD
- Documentação do processo de resposta a pedidos de titulares
- Plano formal de resposta a incidente de segurança

## Consequências

- Novas features que coletam dados adicionais requerem atualização dos Termos e novo consentimento
- DPO (Data Protection Officer) ou responsável equivalente deve ser nomeado
- Auditorias LGPD periódicas fazem parte do ciclo de vida do produto

## Assinaturas

```
[SOVEREIGN] Consentimento granular como invariante. ✓
[BLAST]     Minimização de coleta. Dado não é ativo. ✓
[BAU]       Processo de direitos do titular obrigatório. ✓
[GHOST]     Plano de resposta a incidente registrado como pendência crítica. ✓
[COMPASS]   UI de aceite sem dark patterns. ✓
[SCRIBE]    Artefato válido. Numeração bdr-local-001. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
