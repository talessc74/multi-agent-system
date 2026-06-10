---
id: bdr-local-002
type: BDR
scope: _local
subject: product
title: Modelo de Preços, Acesso Beta e Política de Paywall
status: active
valid-from: 2026-06-10
authors: [COMPASS, EMPIRICUS, POLARBEAR, SOVEREIGN, BLAST, SCOUT, SCRIBE, HERALD]
---

# BDR-LOCAL-002 — Modelo de Preços e Acesso Beta

## Contexto

O EAI? Jurídico (Evidence-Based AI) tem três produtos pagos via Stripe e um nível de acesso especial (beta).
Os preços são fixos em BRL. Usuários beta (`accessLevel='beta'` no Firestore) passam
por todas as features sem pagamento. O campo `accessLevel` é gerenciado exclusivamente
pelo servidor via Admin SDK — nenhum usuário pode alterar seu próprio `accessLevel`.

## Decisão

| Produto | Preço |
|---------|-------|
| Laudo Modos 1, 2, 4 | R$ 9,90 |
| Laudo Modos 3, 5 | R$ 5,90 |
| Chat pós-sessão (5 perguntas) | R$ 2,99 |
| Acesso beta | Gratuito — gerenciado por Firestore Admin |

Mudanças de preço requerem este BDR atualizado + atualização dos Termos de Uso +
comunicação antecipada aos usuários ativos.

## Deliberação da Mesa

**[COMPASS]** A estrutura de preços por modo de simulação é coerente com o valor
percebido — modos mais complexos (1, 2, 4) custam mais. O preço de R$ 2,99 para
chat é um ponto de entrada baixo que testa engajamento pós-simulação. A affordance
de pagamento deve deixar claro o que o usuário recebe antes de pagar — nenhuma
surpresa pós-checkout.

**[EMPIRICUS]** O paywall deve aparecer no momento certo — após o usuário ver o
resultado parcial (censurado), não antes. Isso usa o padrão de "investimento e revelação"
que reduz abandono. A censura de 60% do laudo é o equilíbrio correto entre valor
demonstrado e motivação para pagar.

**[POLARBEAR]** O acesso beta deve ser invisível na navegação — o usuário beta não
deve ver telas de pagamento desnecessárias. A experiência beta é a experiência ideal
do produto: sem fricção de pagamento.

**[SOVEREIGN]** O campo `accessLevel` no Firestore tem regra `allow update: if false`
para o cliente. Isso é correto e inegociável: qualquer mudança de `accessLevel` ocorre
exclusivamente via Admin SDK no servidor, por ação humana deliberada.

**[BLAST]** O `accessLevel` é dado de controle de acesso — deve ter log de alteração
auditável. Cada mudança de `accessLevel` de um usuário deve gerar registro com quem
fez, quando e motivo.

**[SCOUT]** A lógica de bypass de paywall para usuários beta deve ser centralizada em
uma função — não distribuída por múltiplos componentes. `getUserAccessLevel()` já
faz isso; garantir que todo paywall consulte essa função.

## Invariantes Inegociáveis

1. `accessLevel` alterado exclusivamente via Admin SDK — jamais pelo cliente
2. Mudança de preço requer atualização deste BDR + Termos de Uso
3. Toda alteração de `accessLevel` gera log auditável
4. Paywall nunca aparece antes de o usuário ver valor demonstrado do produto
5. Toda lógica de bypass de paywall passa por `getUserAccessLevel()`

## Pendências Registradas

- Implementação de log auditável para alterações de `accessLevel`
- Processo formal de concessão e revogação de acesso beta

## Consequências

- Novo tipo de produto requer novo preço neste BDR antes da implementação
- Promoções e cupons requerem BDR específico ou atualização deste
- Usuários beta são inventariados e revisados periodicamente

## Assinaturas

```
[COMPASS]   Affordance de valor antes do paywall. ✓
[EMPIRICUS] Padrão de investimento e revelação preservado. ✓
[POLARBEAR] Experiência beta sem fricção de pagamento. ✓
[SOVEREIGN] accessLevel server-only inegociável. ✓
[BLAST]     Log auditável como pendência crítica. ✓
[SCOUT]     getUserAccessLevel() como ponto único de lógica beta. ✓
[SCRIBE]    Artefato válido. Numeração bdr-local-002. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
