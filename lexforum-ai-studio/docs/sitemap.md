# Sitemap — telas reais da aplicação (Milestone 1)

Governs by: `.xdrs/_local/adrs/application/plans/001-liquid-glass-rollout.md`.

Mapeamento de toda tela/estado real do app, para garantir que o rollout do
Liquid Glass cubra o sistema completo, não só as telas já prototipadas em
`design-proposal/index.html`. Roteamento é por máquina de estado
(`state.step`), não por React Router — não há paths dedicados além de `/`
e `/termos`.

## Home / Onboarding
- **Boardroom** (`state.step === 'boardroom'`) — `src/pages/BoardroomPage.tsx` — seleção dos 5 modos, navbar, login, tema.
- **Termos de Uso** (`/termos`) — `src/pages/TermosPage.tsx` — página estática.

## Autenticação (modal, sem rota própria)
- Login, Registro, Esqueci a senha, Aceite de termos (novo usuário Google) — todos em `src/components/LoginModal.tsx`, diferenciados por `mode`.

## Input por modo
- Modo 1 — Tese Estratégica
- Modo 2 — Defesa sob Ataque
- Modo 3 — Mesa Dupla (Juiz)
- Modo 4 — Mesa Dupla (Assistida) — com seletor de lado (`userSide`)
- Modo 5 — Revisão Pós-Conflito — com sub-caso (Recurso/Acordo)

Todas inline em `src/App.tsx`, renderizadas condicionalmente por `state.selectedMode`.

## Fluxo de simulação
- **Confirmação de área** (`state.step === 'confirm'`) — área jurídica detectada, agentes atribuídos.
- **Simulando** (`state.step === 'simulating'`) — progresso via SSE (ADR application/002).

## Resultado
- **Travado/paywall** (`result && !isUnlocked`) — preview censurado, CTA Stripe.
- **Desbloqueado** (`result && isUnlocked`) — laudo completo, `success_probability`/`userSide` (EDR principles/001).

## Meus Casos
- Modal de histórico — `src/App.tsx` (~4224) — gated por auth, lista casos salvos.

## Pagamento
- Checkout Stripe (desbloqueio de laudo) — externo, hospedado.
- Checkout Stripe (acesso a chat) — externo, hospedado.

## Chat
- `src/components/ChatPanel.tsx` — bottom sheet, só com resultado desbloqueado + usuário autenticado.

## Outros
- `src/components/LoadingScreen.tsx` — streaming de progresso (SSE).

## Gates / feature flags
- Beta access → desbloqueio automático.
- Chat → exige resultado desbloqueado + login.
- Promo code → valida via `/api/stripe/validate-promo-code`.
- `?sim={id}` → carrega simulação salva; `?chat=1` → abre chat automaticamente.

## Variantes responsivas
- Mobile (`md:hidden`) e Desktop (`hidden md:flex`) para todas as telas acima; desktop adiciona Forge Monitor / sidebars.

## Status
**21 telas/estado mapeados.** Nenhum admin/settings screen encontrado — não existe no codebase atual.

Pendente: aprovação do product owner (item do checklist do Milestone 1).
