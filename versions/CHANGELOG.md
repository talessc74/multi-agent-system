# CHANGELOG — Multi-Agent System

Todos os registros de versões, mudanças e decisões do projeto.

---

## [EAI? App] — Histórico de Sessões

Sessões de desenvolvimento do EAI? Studio (`lexforum-ai-studio/`).
Contexto completo sobre arquitetura ativa e pendências em `CLAUDE.md`.

---

### 2026-05-30 — Sprint de UX Mobile e Tema Claro

**7 entregas em produção**

#### Tema claro — BoardroomPage completo

- [FIX] 1d0e3ad — BoardroomPage mobile: textos de header (label, título, subtítulo) com tokens CSS var() — contraste no tema claro
- [FIX] 90ea582 — BoardroomPage mobile: nomes dos modos com token var(--text-primary)
- [FIX] 1bad845 — BoardroomPage: todos os textos restantes (desktop hero, disclaimer, cards, footer, boardroom panel, card expandido mobile) com tokens CSS — tema claro completo

#### UX — Feedback e wayfinding

- [UX] 12cbe08 — LaudoMobile: estado isExpanding adicionado — feedback visual "⏳ Expandindo argumento..." ao clicar hipótese
- [UX] af17ec7 — LaudoMobile: botão PDF mantém estado "⏳ Gerando PDF..." até usuário cancelar — sem reset automático por timeout
- [UX] 3cffcce — LaudoMobile: botão "Ver como a outra parte vai reagir" movido do corpo do laudo para a barra sticky do rodapé
- [UX] 7a168a6 — LaudoMobile: hipóteses (loading, opções A/B/C, expandindo, Modo 4) movidas inteiramente para barra sticky do rodapé — sem scroll necessário

#### Testes aprovados

- BoardroomPage tema claro mobile ✅
- Desktop Modo 2 título diferenciado ✅
- Hipóteses na barra sticky — fluxo completo ✅
- Tema claro contraste geral ✅ (com ressalva: pode ficar mais escuro — não tratado)

#### Pendências registradas

- Tema claro App.tsx (telas de simulação, laudo, input) — não iniciado
- "Invalid Date" nos registros antigos do Firestore
- Chat pós-sessão — Tales quer detalhar feature de perguntas ao advogado e juiz

---

### 2026-05-29 — Sprint de Tema e Diferenciação de Modos

**2 entregas em produção**

#### Tema claro/escuro — BoardroomPage

- [FIX] 1c884fe — BoardroomPage.tsx: cores hardcoded (`bg-[#111111]`, `bg-[#1a1a1a]`, `bg-[#0e0e0e]`) substituídas por tokens CSS (`var(--bg-primary)`, `var(--bg-card)`, `var(--bg-secondary)`). Tema claro/escuro agora funciona corretamente no mobile e desktop.

#### Diferenciação de modos desktop

- [FIX] e7070bc — App.tsx: título e subtítulo da tela de input desktop agora mudam por modo. Modo 2 exibe "Descreva a acusação recebida e sua versão dos fatos." + "Nossa IA constrói sua defesa técnica e o juiz avalia em até 3 ciclos." Demais modos mantêm o texto original.

#### Pendências registradas desta sessão

- Tema claro desktop (App.tsx + index.css) — tokens CSS não aplicados ainda
- Testes visuais pendentes: toggle de tema no iPhone + Modo 2 desktop
- Chat pós-sessão: Tales quer detalhar feature de perguntas direcionadas ao advogado e ao juiz da simulação

---

### 2026-05-28 — Sprint de Qualidade e Bugs Críticos

**16 entregas em produção**

#### Bugs críticos resolvidos

- [FIX] db1e60f — Firestore rules: `request.auth != null` adicionado antes de `.uid` no segundo ramo do `||`. Permite `saveSimulation` sem autenticação (userId: null). Usuário pode simular sem login e pagar no paywall.
- [FIX] 8800d8b — Mobile: `LaudoMobile` extraído como componente próprio antes do `export default function App()`. Resolve tela preta crítica causada por `React.useState` dentro de IIFE — hook inválido crashava o React silenciosamente toda vez que `isUnlocked === true`.
- [FIX] ec686ba — Mobile: PDF exporta via layout desktop. `handlePrint` interno adiciona classe `eai-printing` ao body. CSS `@media print { .eai-laudo-mobile { display: none !important } }` oculta overlay mobile no print, renderizando o layout desktop com regras de print existentes.

#### Agentes e resolver

- [FIX] 9f0b8cf — agent-resolver: `findAgentFirestore` agora filtra por `lado` (acusacao/defesa). `createAndSaveAgent` persiste campo `lado` no Firestore. Novos agentes criados sob demanda já nascem com o lado correto.
- [FIX] eba6ea2 — server.ts: `lawyerSide` calculado por modo antes de chamar `resolveAgent`. Modo 2 → `DEFENSE`. Modos 1/3/4/5 → `AUTHOR`. Advogado de defesa não é mais confundido com advogado de acusação.
- [FIX] 33f54ff — agent-creator: instrução obrigatória de português brasileiro inserida no início do prompt de `generateAgent`. Novos agentes gerados dinamicamente operam em português.

#### UI e produto

- [FIX] 5185086 — `areaLabels`: 11 novas entradas em português adicionadas (CHILDREN_AND_ADOLESCENT, DISABILITY_RIGHTS, EDUCATIONAL, INTERNATIONAL, FINANCIAL, FINANCIAL_CRIMES, CRIMINAL_FINANCIAL, HUMAN_RIGHTS, INTELLECTUAL_PROPERTY, REAL_ESTATE, INTERNATIONAL_LAW). Elimina áreas em inglês na UI.
- [FIX] 506d32a — Resultado Modo 2: botão "Quer ver como o outro lado vai contra-atacar?" removido. Opção de contraditório agora exclusiva do Modo 1.
- [FIX] dd76c19 — Meus Casos: data de criação exibida corretamente. Cobre 3 formatos de `createdAt` do Firestore: `.toDate()`, `._seconds` e string/number bruta. Fallback alterado de "Simulação Recente" para "Data não disponível".
- [UX] 8bf3dde — Botão "Exportar PDF": feedback visual durante geração. Mobile: estado `isPrinting` desabilita botão, muda cursor e exibe "⏳ Gerando PDF...". Desktop: texto troca para "⏳ Gerando..." antes de `window.print()`.
- [FEAT] 6a9e1bc — Mobile: fluxo Modo 4 pós-laudo disponível no `LaudoMobile`. Botão "Ver como a outra parte vai reagir", loader de hipóteses, lista de opções e painel do argumento expandido com botão "Simular contraditório no Modo 4 →".

#### Documentação e infraestrutura

- [DOCS] c21b005 — CLAUDE.md: tabela de clusters de agentes removida. Substituída por ponteiro: "Agentes operacionais vivem no Firestore, coleção `agents`". Shaw e Especialista permanecem documentados como criadores.

#### Decisões arquiteturais desta sessão

- **Login no paywall (Opção A):** usuário simula sem login, pede autenticação só no momento do pagamento. `saveSimulation` com `userId: null` liberado.
- **Agentes por lado:** campo `lado` (acusacao/defesa) adicionado ao schema do Firestore. Os 27 agentes existentes não têm o campo — novos agentes já nascem corretos.
- **areaLabels como fonte de verdade:** áreas não mapeadas geravam fallback em inglês. Solução: expandir o mapa, não alterar o fallback.

#### Débito técnico registrado

- `agent-creator.ts`: 3 erros TypeScript pré-existentes (`systemInstruction` não reconhecido no tipo `GenerateContentParameters`) — não bloqueiam funcionamento.
- 27 agentes no Firestore sem campo `lado` — órfãos temporários, não causam dano.

---

### 2026-05-27 — Bugs e Correções (manhã/tarde)

**4 entregas em produção**

#### Fix 1 — Sobreposição do título no resultado mobile [FIX] commit c92f607
- App.tsx: bloco "Laudo Estratégico" alterado de `flex items-center justify-between` para `flex flex-col md:flex-row md:items-center md:justify-between gap-6`
- App.tsx: h2 alterado de `text-5xl` para `text-3xl md:text-5xl`
- Bug identificado via screenshot do iPhone — título em Playfair sobrepunha o bloco do percentual por ausência de quebra de coluna em mobile.

#### Fix 2 — Instrução de polos processuais nos 3 prompts do relatório [FIX] commit 289973e
- gemini.server.ts: systemInstruction dos 3 prompts de generateReportServer corrigidos (layman, professional, causeSummary)
- Instrução adicionada: identificar com precisão Exequente/Autor e Executado/Réu antes de redigir
- Proibido parafrasear argumentos adversos sem identificá-los com conectores explícitos
- Resolve inversão de polos processuais reportada por consultor jurídico externo via laudo real

#### Fix 3 — Juiz gerado com área obrigatória [FIX] commit 284e18f
- gemini.server.ts: prompt de geração do juiz em getOrGenerateAgent reforçado com instrução explícita de área
- Juiz LABOR → instrui Juiz do Trabalho. Juiz CIVIL → instrui Juiz Cível. Nunca jurisdição incompatível.
- cacheKey de juiz específico corrigido: `judge_specific_${specificName}` → `judge_specific_${area}_${specificName}`
- Resolve bug reportado: causa trabalhista julgada por juiz civil do TJPR
- Firestore analisado: não há agentes corrompidos — nenhum agente precisa ser deletado

#### Deploy — Índice Firestore ativo em produção [CONFIG]
- `firebase deploy --only firestore:indexes --project gen-lang-client-0982741688` executado
- Índice composto `agents: area ASC + tipo ASC` confirmado ativo em produção

#### Pendência registrada
- `firestore.rules` contém warnings: funções não usadas e variáveis com nomes reservados — não bloqueiam funcionamento, limpeza futura

---

### 2026-05-26 — Sprint 4 Mobile (manhã)

**2 entregas + 1 pendência registrada**

#### Fix — Sobreposição do título no resultado mobile [FIX] commit c92f607
- Mesmo fix descrito em 27/05 — identificado nesta sessão, aplicado e registrado definitivamente em 27/05

#### Deploy — Índice Firestore ativo em produção [CONFIG]
- `firebase deploy --only firestore:indexes --project gen-lang-client-0982741688` executado com sucesso
- Índice composto `agents: area ASC + tipo ASC` confirmado ativo em produção
- Queries compostas de busca de agentes agora têm índice — consistência entre execuções garantida

#### Descartado
- Legibilidade textos secundários mobile (label/subtítulo/disclaimer) — aprovado visualmente pelo Tales sem alteração necessária

---

### 2026-05-26 — Sprint 3 Mobile: Home mobile e accordion de modos

**8 commits direto em main — deploy automático disparado**

#### Correções de base (Sprint 2 → Sprint 3)
- [FIX] 2f3bed1 — Overlays dos modos 1–5 restritos a mobile (`md:hidden`). Desktop mantém layout original. Condição `selectedMode < 3` restaurada no AnimatePresence.
- [FIX] 3d7771c — ModeNavbar: toggle de tema sol/lua adicionado ao lado do EAI✓? (mesmo padrão do Navbar.tsx do Sprint 1).

#### Home mobile — nova tela de entrada
- [FEAT] 7db4c6e — Tela de entrada mobile substituindo a BoardroomPage em viewport < 768px. Bloco `md:hidden`: label SIMULADOR JURÍDICO, headline Playfair 44px, subtítulo 15px. Conteúdo desktop envolto em `hidden md:block` com `id="modos"`.
- [FIX] 5c6eac6 — Remove link "Sou profissional" do bloco mobile.
- [FIX] 0196c7b — Substitui botão CTA único pelos 5 modos coloridos: cards full-width com nome, preço e "Começar →" nas cores #00FFEF / #FF6B6B / #A882FF / #FFB800 / #00CC88.

#### Accordion de modos
- [FIX] 67f4e88 — Cards flat substituídos por accordion. Fechado: ícone 32px + nome 16px + chevron →. Aberto: descrição + "Ideal para:" + tagline + preço + botão "Começar →" 48px. Um card aberto por vez via `openMode` state. Dados via `MODE_CONFIG`.
- [FIX] ad5329c — Preço removido do header fechado. No bloco expandido: preço font-mono 13px na cor do modo acima do botão.
- [FIX] 8540e56 — Rodapé mobile: `v2.4.0 · {hash}` abaixo do disclaimer de preço.

---

### 2026-05-26 — Sprint 2 Mobile: Zona de Contexto e telas dos 5 modos

**9 commits + merge em main — deploy automático disparado**

Branch: `feature/mobile-sprint2-modes` → merge `0da9a42` em main.

#### Novos arquivos
- `lexforum-ai-studio/src/components/ContextZone.tsx` — componente reutilizável com borda lateral colorida, descrição e colunas "O que trazer / O que receber". Cores via `style prop` com `var()`. Zero hardcoded.
- `lexforum-ai-studio/src/components/ModeNavbar.tsx` — navbar de modo `[← Voltar] [TAG] [EAI✓?]`, 56px, blur(12px), tokens CSS Sprint 1.
- `lexforum-ai-studio/src/config/modeConfig.ts` — interface `ModeConfig` + dados completos dos 5 modos (cor, colorRgb, headline, tagline, description, bring[], receive[], cta, inputType, hasAttachment, hasSelector, selectorType).

#### Telas dos 5 modos
Cada modo (1–5) tem overlay `position: fixed; z-index: 200` independente do layout desktop. Fluxo: overlay Input → confirm/simulating/result no layout existente (sem quebra de comportamento).

| Modo | Cor | CTA | Seletor |
|---|---|---|---|
| 1 — Tese Estratégica | #00FFEF | Validar causa → | — |
| 2 — Defesa sob Ataque | #FF6B6B | Validar defesa → | — |
| 3 — Mesa Dupla — Juiz | #A882FF | Consultar magistrado → | — |
| 4 — Mesa Dupla — Assistida | #FFB800 | Iniciar simulação → | ⚔️ Acusação / 🛡 Defesa |
| 5 — Revisão Pós-Conflito | #00CC88 | Analisar agora → | ⚖️ Recorrer / 🤝 Acordo |

CTA fixo no bottom com `padding-bottom: calc(16px + env(safe-area-inset-bottom))`. Modo 4 e 5: CTA desabilitado sem seleção. Modos 3, 4, 5: `padding-bottom: 100px` no container scrollável.

---

### 2026-05-25 — Sprint 1 Mobile: Fundação CSS

**5 commits + merge em main**

Branch: `feature/mobile-first` → merge `191c912` em main.

- [FEAT] 1c6ae17 — Tokens CSS custom properties dark/light: `index.css` com 13 tokens completos (`--bg-primary`, `--bg-secondary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-press`, `--accent-muted`, `--border`, `--border-active`, `--price`, `--success`, `--danger`). Bloco `[data-theme='light']` com overrides.
- [FEAT] 9f5e01b — Script anti-flash no `index.html`: script inline no `<head>` lê `localStorage('theme')` antes do React montar. Elimina FOUC.
- [FEAT] ac63921 — `Navbar.tsx` sticky 56px + backdrop-filter blur(12px). `useTheme.ts` persiste tema em localStorage, aplica `data-theme` no `<html>`. `App.tsx` e `BoardroomPage.tsx` refatorados para usar Navbar.
- [FIX] a7122c1 — Navbar: remove 6 variáveis JS de cor computadas. Todos os `style={{}}` usam tokens CSS via `var()`.
- [FIX] a64b4be — Logo: glifo ✓? era SVG com `strokeWidth="14"`. Substituído por `<span>` com `font-playfair font-bold` — propriedades idênticas ao span "EAI". Remove dependência `motion/react`.

---

### 2026-05-24 — Grupo 1 zerado + Evoluções C e D

**8+ entregas em produção — deploy automático validado**

#### Grupo 1 — concluído
- [FIX] 87d575a — Modos 1/2: linguagem de julgamento substituída por "avaliação técnica". Prompt do Juiz ajustado no gemini.server.ts.
- [FEAT] c4831cb — Resumo da Causa: terceiro output paralelo no generateReportServer. Campo causeSummary em ReportContent. Anonimização incluída no anonymizer.ts.
- [FIX] afe3210 — Meus Casos: race condition do Auth resolvida. handleShowHistory busca histórico sob demanda no clique.
- [FIX] 694b831 — Percentual de êxito visível antes do paywall. Exibido no topo do card de bloqueio em text-7xl.
- [FEAT] 3af0f2f — Email de contato eaijuridico@icloud.com no FOOTER_STATS e no pill do resultado desbloqueado.
- [FEAT] 2c6e0bb + 7be1d84 — Versionamento dinâmico: v2.4.0 · {hash} via VITE_GIT_HASH=$SHORT_SHA injetado no cloudbuild.yaml.
- Trigger automático Cloud Build validado de ponta a ponta — todo push em main deploya automaticamente em produção.

#### Evolução C — hipóteses de contraditório
- [FEAT] d7134e3 — Parte 1/3: tipos e funções server-side
- [FEAT] 3f74e63 — Parte 2/3: rotas server e funções cliente
- [FEAT] 41a10c8 — Parte 3/3: UI de hipóteses de contraditório
- [FIX] 8b780c3 — Feedback visual ao expandir hipótese

#### Evolução D — Modo 4 pré-carregado
- [FEAT] 5fb0d69 — Modo 4 pré-carregado com mensagem de continuação e campos somente leitura
- Desconto R$4,90 → fila futura (aguarda dados reais de uso)

#### Correções pós-Evolução C/D
- [FIX] 54068c4 — Meus Casos: modal disponível em qualquer step, incluindo Boardroom. Abre na primeira vez.
- [FIX] 40fcc0a + 7f094a0 — Descrição Modo 1 simplificada: "Descreva sua situação. Descubra se você tem razão e qual sua chance real de ganhar."
- [FEAT] 66ef4fc — Modo 4: botão "Editar campos" protege campos pré-carregados de edição acidental.
- [FIX] e869fe5 — Boardroom lateral: "Taxa de Sucesso" substituído por "Índice de Força Argumentativa"

#### Fila futura (decisões tomadas nesta sessão)
- Desconto R$4,90 Modo 1→4: implementar junto com validação server-side anti-abuso (simulationId de origem)
- Botão editar no argumento expandido (Modo 1 → antes do Modo 4)
- Comunicação clara da jornada Modo 1 → hipóteses → Modo 4 com preço explícito

---

### 2026-05-23 — Alertas e UX de Erro (tarde)

**3 fixes + 1 feat em produção**

- [FIX] f7434fc — gemini.server.ts: console.log('[DEBUG extractProbability]') removido. Petições dos usuários não vazam mais nos logs do GCP.
- [FIX] d622375 — App.tsx: bloco isQuota reescrito em linguagem humana. Novo texto: "O sistema está temporariamente indisponível. Tente novamente em alguns minutos."
- [FEAT] 08e2c07 + fa5186d — Função notifySpendingCap() em server.ts — instanciação lazy do Resend. Disparo automático quando RESOURCE_EXHAUSTED detectado nas 4 rotas: validate, simulate, report, mode5. RESEND_API_KEY e ALERT_EMAIL configurados nos dois ambientes.

---

### 2026-05-23 — Stripe end-to-end + Firebase Auth

**3 fixes aplicados — pagamento live funcionando**

- [FIX] 6bf94aa — server.ts: `express.json()` global consumia o body antes do `express.raw()` do webhook. Correção: middleware JSON exclui o path `/api/webhook/stripe`. Webhook passou a retornar 200 e gravar pagamento no Firestore corretamente.
- [FIX] c8fbc09 — App.tsx: `useEffect([user])` saía antes de verificar pagamento quando Auth ainda inicializando. dbService.ts: `getSimulationById` adicionada. Laudo agora carrega automaticamente ao retornar do Stripe sem interação do usuário.
- [CONFIG] — 3 vars Admin SDK adicionadas ao `.env` local. 3 Codespace Secrets criados no GitHub. Arquivo JSON da Service Account deletado do Codespace após uso.

**Resultado:** fluxo Stripe end-to-end validado com cartão real em modo live.

---

### 2026-05-22 — LegalArea dinâmico

- `LegalArea` migrado de enum fechado para `type string` aberto
- `validateCausa` — prompt de classificação liberado: Gemini identifica qualquer ramo do direito brasileiro
- `areaLabels` expandido com MARITIME, CRIMINAL, TAX, ENVIRONMENTAL, ADMINISTRATIVE, CORPORATE + `formatAreaLabel()` para fallback de áreas desconhecidas
- AgentResolver já cria advogado+juiz sob demanda para qualquer área não encontrada na prateleira
- Commits: 325f114, 49ea734, 024d321, 8f004bc, 2cc2cb1, d487dff (fix esbuild — import type)

---

### 2026-05-22 — Recuperação de senha

- [FEAT] commits aff30e2 → f1efed5 — firebase.ts: resetPassword exportado. LoginModal.tsx: modo 'forgot' adicionado ao union type. handleForgot implementado com resetPassword do Firebase. Título do modal adaptado ao modo ativo. Bloco visual forgot: formulário + tela de confirmação pós-envio.
- Implementação cirúrgica — 7 commits atômicos, zero substituição de arquivo.

---

### 2026-05-21 — EAI? Evoluções UX, SSE e Consistência (noite)

**8 entregas + decisões arquiteturais**

- [FIX] 81b7a87 — App.tsx: card "FORO / COMARCA" substituído por "ESPECIALIZAÇÃO" com texto dinâmico baseado na área detectada. Referência ao specificJudge removida da tela confirm.
- [FIX] 709eff7 — gemini.server.ts: 11 temperatures aplicadas conforme tipo de agente. Juiz: 0.3 / Advogado: 0.65 / Brief: 0.5 / Validação e Relatório: 0.2 / Geração de agente: 0.4.
- [DOCS] e57ef5a — Criado `lexforum-ai-studio/docs/agent-temperature-rationale.md`. 11 comentários inline adicionados no gemini.server.ts.
- [FEAT] a2cdada — App.tsx: camada de incerteza abaixo do percentual em todos os modos ("Índice de força argumentativa — não probabilidade estatística." / "Estimativa baseada na sua descrição. Resultados reais variam.").
- [FIX] a586dd5 — App.tsx: 3 disclaimers diferentes unificados: "O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado."
- [FEAT] 13a59f5 — App.tsx: bloco condicional com recursos de apoio quando detectedArea === FAMILY ou SOCIAL_SECURITY (180, 188/CVV, Defensoria Pública, CRAS). Inserido em 3 pontos.
- [FEAT] 005c553 — SSE retry: MAX_RETRIES=3, backoff 1.5s × tentativa. Banner âmbar "Reconectando..." durante retry. Botão "Tentar Novamente" com state preservado. Resolve Safari mobile.
- **Decisão arquitetural:** Registry local descartado — NÃO criar registry local com agentes pré-fabricados. Shaw+Especialista criam sob demanda; Firestore garante consistência.

---

### 2026-05-21 — Login, Cadastro e Deploy (noite)

- [FIX] 66ce141 — BoardroomPage.tsx e App.tsx: Logo compacta em mobile (size="sm" showText={false}).
- [FEAT] 096be16 — Criado LoginModal.tsx. Modal com botão Google + formulário email/senha. Botão "Entrar" abre modal.
- [FIX] d45484c — BoardroomPage.tsx: onSuccess do LoginModal não chama onLogin() desnecessariamente.
- [FEAT] 41abd68 — LoginModal.tsx: modo register com email + senha + confirmar senha. Link de alternância entre modos. Cadastro testado e funcionando.

---

### 2026-05-21 — Correções Mobile e Bug 3

- [FIX] a6f3cdd — BoardroomPage.tsx: px-8 → px-4 md:px-8, gap-6 → gap-3 md:gap-6. Botão "Meus Casos" com hidden md:inline. Corrige logo cortada em telas pequenas.
- [FIX] ba0328d — Mesmo padrão aplicado ao header das telas de simulação.
- [FIX] a686815 — Bug 3 resolvido: gemini.server.ts injeta sideContext na systemInstruction do advogado. DEFENSE → defender réu. AUTHOR → defender autor. Sem criar novos agentes.

---

### 2026-05-20 — Stripe + Paywall

**Integração Stripe completa — paywall real substituindo setState fictício**

- `firebase-admin` instalado — Admin SDK disponível no servidor
- `dbService.ts` — `saveSimulation` retorna `simulationId`; novas funções `createOrUpdateUser`, `hasUserPaidForSession`, `getUserAccessLevel`
- `firestore.rules` — collection `users` protegida; subcollection `payments/{simulationId}` somente Admin SDK
- `server.ts` — Admin SDK inicializado com credenciais via env vars; rota `POST /api/stripe/create-checkout-session`; webhook `checkout.session.completed` grava pagamento no Firestore
- `App.tsx` — `handleCheckout` chama o Stripe; retorno via `?sim=ID` verifica pagamento e libera laudo
- `types.ts` — `simulationId` adicionado ao `AppState`

**Arquitetura de segurança:** `userId` server-side via token Firebase. `accessLevel` Admin SDK only. Subcollection `users/{uid}/payments/{simulationId}` como prova de pagamento.

**Commit:** `593d267` — [FEAT] Stripe — checkout session, webhook, paywall e controle de acesso beta

---

### 2026-05-20 — Correção de Bugs (noite)

- [FIX] 7c7656e — Bug 1: App.tsx: `isUnlocked: false` hardcoded removido do setState do Modo 5 — estado beta preservado via spread.
- [FIX] 721ff64 — Bug 2: agent-creator.ts: nomeAgente alterado de "Auditor Kern 0xF1" para "Arquiteto Especialista" — nome interno não vaza mais no output do advogado.
- [FIX] fd9bfcb — Bug 3: userSide adicionado à interface ResolveParams e CreateAgentParams, propagado até a description do agente criado dinamicamente.
- [FIX] 3f71a07 — Bug 4: guard explícito `specificJudge && specificJudge !== 'null'` nas 3 ocorrências — string "null" não passa mais para o agente.

---

### 2026-05-20 — Entregas iniciais da sessão

- Login Google funcionando nas duas páginas (BoardroomPage + App)
- `authDomain` corrigido para `eairadiokactus.firebaseapp.com`
- Header consistente entre BoardroomPage e App (Logo, Meus Casos, dropdown de usuário)
- Anonimização automática antes de salvar no Firebase (`anonymizer.ts` — CPF, CNPJ, e-mail, telefone, endereço, nº processo)
- Modo 5 calibrado — `successProbability` substitui `confidenceLevel`; barra visual com faixas semânticas por subcaso (RECURSO / ACORDO)
- Modelo de preços definido e documentado

---

## [3.5.0] — 2026-05-05

### [AGENTE] recepcionista_v1.0 — Agente de Triagem Visual LexForum

- [AGENTE] `agents/recepcionista_v1.0.json` criado — Recepcionista LexForum: identifica perfil do usuário (leigo / profissional) em 1 interação visual e redireciona para /causa sem fricção. Legado: SEED_UX_001.
- 2 cards visuais com `decision_gates` para linguagem adaptativa por perfil
- Comportamento de fallback: aguardar 30s sem pressionar, exibir mensagem de calma
- AGENTS_REGISTRY.json atualizado: 11 → 12 agentes (`total_agentes: 12`)

---

## [3.4.0] — 2026-05-05

### [FEAT] Conselho Consultivo LexForum v1.0 — Advisory Board estratégico

**Escopo:** Criação do cluster Advisory Board com 4 novas sementes, 1 agente multi-seed e 1 framework reutilizável.

#### Sementes
- [SEMENTE] SEED_ADV_001 v1.0 criada — legado de visão de produto: simplicidade, inovação radical, foco extremo.
- [SEMENTE] SEED_ADV_002 v1.0 criada — legado de estratégia de negócio: monopólio criativo, pensamento contrário, vantagem do último movimento.
- [SEMENTE] SEED_ADV_003 v1.0 criada — legado de crescimento: product-market fit, must-have score, North Star Metric.
- [SEMENTE] SEED_ADV_004 v1.0 criada — legado do futuro do direito: democratização do acesso à justiça, transformação da profissão jurídica por tecnologia.

#### Agentes
- [AGENTE] conselho_consultivo_lexforum v1.0 gerado — Advisory Board estratégico com 5 membros (SEED_ADV_001–004 + SEED_UX_001). Arquitetura não-padrão (multi-seed, sem blocos logicaArquivos/logicaInterpretacao/instrucoesEspecificas/diretrizesEticas) — desvio intencional documentado.

#### Config
- [CONFIG] `config/advisory_board_framework.json` adicionado — framework reutilizável para instanciar Advisory Boards em novos projetos. Papéis fixos 1–4 com sementes reutilizáveis; papel 5 específico de domínio via Semente de Shaw.

#### Registries
- SEEDS_REGISTRY.json atualizado: 9 → 13 sementes (`total_sementes: 13`)
- AGENTS_REGISTRY.json atualizado: 10 → 11 agentes (`total_agentes: 11`)

#### CLAUDE.md
- [DOCS] Scale counter atualizado: v3.3.0 → v3.4.0, 9 seeds → 13, 10 agents → 11
- [DOCS] Domain Clusters: novo cluster "Advisory Board" adicionado (SEED_ADV_001–004, conselho_consultivo_lexforum)
- [DOCS] Overview: referência ao advisory board framework adicionada

### [REVISAO] Kernel → Legado — pseudonimização semântica global

**Escopo:** Substituição do termo "Kernel" (maiúsculo, semântico) por "Legado" em todos os arquivos públicos do repositório. Chaves técnicas de JSON (`kernel_logic`, `kernel_jurisprudencial`) mantidas intactas.

- 19 arquivos atualizados: agents/ (7), seeds/ (9), docs/README.md, versions/CHANGELOG.md, lexforum-app/src/app/page.tsx

---

## [3.3.0] — 2026-05-05

### [REVISAO] Auditoria completa do sistema — Argus (Revisão de Saúde v3.3.0)

**Escopo:** Incorporação do lexforum-app ao repositório, correção do tsconfig.json e atualização de documentação.

#### CLAUDE.md
- [DOCS] Versão atualizada de v3.1.0 para v3.3.0
- [DOCS] Nova seção "Web Application — LexForum" adicionada: stack, deploy URL, design system, convenção de commits para o app
- [DOCS] Overview reescrito para refletir repositório híbrido (multi-agent system + web app)

#### LexForum App
- [FIX] `lexforum-app/tsconfig.json` corrigido:
  - `jsx: "preserve"` → `jsx: "react-jsx"` (necessário para React 18 sem import explícito de React)
  - `target: "ES2017"` adicionado (alinha com suporte Next.js 16)
  - `.next/dev/types/**/*.ts` adicionado ao `include` (necessário para tipos de dev mode do Next.js 16)

#### Relatório de Saúde
- [REVISAO] `versions/HEALTH_REPORT_v3.3.0.md` gerado — cobre estado pós-integração do lexforum-app

---

## [3.2.1] — 2026-05-05

### [FEAT] LexForum — design system navy/ciano + homepage aprovada

- Design system implementado: paleta navy (`#0A1628`) + ciano (`#00C4CC`) no `tailwind.config.ts`
- Homepage (`src/app/page.tsx`) implementada e aprovada visualmente
- Deploy realizado na Vercel em `lexforum.radiokactus.com`

---

## [3.2.0-lexforum] — 2026-05-05

### [FEAT] LexForum MVP v0.1.0 — estrutura base Next.js 16 + Tailwind CSS

- `lexforum-app/` adicionado ao repositório como subprojeto independente
- Stack: Next.js 16, React 18, TypeScript 5, Tailwind CSS 3
- Estrutura base: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Configurações: `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- `.gitignore` específico para o app (exclui `.next/`, `node_modules/`, `.env*.local`)

---

## [3.2.0] — 2026-05-05

### [SECURITY] Pseudonimização completa do repositório (Argus — modo SECURITY)

Operação de segurança executada para eliminar todos os nomes reais de pessoas físicas do repositório público. Nenhum nome real permanece em qualquer arquivo rastreado pelo git após este commit.

**Escopo da operação:**

#### Seeds
- [SECURITY] 9 arquivos de semente com nomes reais removidos via `git rm`:
  - Substituídos por 9 novos arquivos SEED_* com nomenclatura pseudonimizada
  - Mapeamento one-to-one: conteúdo preservado, identificação por ID
- [SECURITY] `seeds/SEEDS_REGISTRY.json` reescrito: todos os `seed_id`, `nome` e `arquivo` atualizados para IDs pseudonimizados (`SEED_AI_001`, `SEED_ENG_001`, `SEED_PM_001`, `SEED_JUR_001`–`004`, `SEED_UX_001`, `SEED_SYS_001`)

#### Agentes
- [SECURITY] 10 agentes atualizados: campos `nomeAgente`, `versao.seed_utilizada` e referências textuais a nomes reais substituídos por IDs de legado
- [SECURITY] `agents/AGENTS_REGISTRY.json` reescrito: todos os campos `nome` e `seed_utilizada` atualizados
- Agentes afetados: `consultor_ia`, `agente_claude_code_expert`, `arquiteto_produto`, `advogado_consumerista`, `juiz_jec`, `ux_validator`, `juiz_everton`, `juiza_rosemarie`, `advogado_mannrich`, `revisor_sistema`

#### Documentação e config
- [SECURITY] `CLAUDE.md`: tabela de Domain Clusters atualizada com IDs pseudonimizados
- [SECURITY] `versions/CHANGELOG.md`: todas as entradas históricas sanitizadas
- [SECURITY] `versions/HEALTH_REPORT_v3.1.0.md`: inventário de seeds atualizado
- [SECURITY] `.gitignore`: adicionado `PRIVATE_SEED_REGISTRY.json` (registro privado com mapeamento ID ↔ fonte)

**Mapeamento de referência (não versionado — manter fora do repositório):**

| ID Público | Cluster |
|---|---|
| SEED_AI_001 | IA & Tech |
| SEED_ENG_001 | IA & Tech |
| SEED_SYS_001 | IA & Tech (sistema) |
| SEED_PM_001 | Produto & UX |
| SEED_UX_001 | Produto & UX |
| SEED_JUR_001 | Jurídico Consumerista |
| SEED_JUR_002 | Jurídico Consumerista (jurisprudencial) |
| SEED_JUR_003 | Jurídico Consumerista (jurisprudencial) |
| SEED_JUR_004 | Jurídico Trabalhista |

---

## [3.1.2] — 2026-05-04

### Correções Estruturais (Argus — Revisor do Sistema)

- [FIX] `agents/juiza_rosemarie_v1.0.json` corrigido integralmente — erro factual crítico detectado pelo JURIS_SEED_GENERATOR na branch `semente-jurisprudencial` e corrigido por Argus na main:
  - **Erro**: agente v1.0.0 gerado a partir do legado SEED_JUR_003_v2.0 (versão anterior), que identificava incorretamente a magistrada SEED_JUR_003 como "Ministra do STJ — 4ª Turma e 2ª Seção"
  - **Fato verificado**: cargo real é Desembargadora Federal do Trabalho do TRT-9 desde 11/11/1996 — nunca integrou o STJ
  - **Campos corrigidos**:
    - `nomeAgente`: `"Ministra SEED_JUR_003 — STJ..."` → `"Desembargadora SEED_JUR_003 — TRT-9..."`
    - `versao.numero`: `"1.0.0"` → `"1.1.0"` (major minor bump por correção de conteúdo)
    - `versao.seed_utilizada`: `"SEED_JUR_003_v2.0"` (anterior) → `"SEED_JUR_003_v2.0"` (corrigido)
    - `versao.tipo`: STJ/civil → TRT-9/trabalhista
    - `versao.nota_correcao`: campo adicionado com rastreabilidade do erro e da correção
    - `objetivo`: STJ/consumidor/bancos → TRT-9/trabalhista/dispensa discriminatória/reintegração/rescisão indireta
    - `kernel_logic.philosophy` e `kernel_logic.axiomas`: 6 axiomas STJ/consumidor → 6 axiomas trabalhistas baseados no legado SEED_JUR_003_v2.0 (vulnerabilidade, ônus ao empregador, acesso à Justiça digital, rescisão indireta, astreintes)
    - `logicaArquivos` completo: objetivo, densidade mínima e 3 entregáveis reescritos para direito trabalhista
    - `logicaInterpretacao.revisaoAutomatica.etapas`: 6 etapas STJ → 6 etapas TRT-9 (competência, vulnerabilidade, Súmula 443, rescisão indireta, acesso à Justiça digital, sanção)
    - `logicaInterpretacao.coreTraits`: 5 traits STJ/consumidor → 5 traits TRT-9/trabalhista
    - `instrucoesEspecificas.mainObjective`, `.restricoes` (5), `.analysisProcess.steps` (6): todos reescritos para direito trabalhista
    - `instrucoesEspecificas.exemplos_de_prompts_validados`: 3 casos STJ/consumidor substituídos por 3 casos TRT-9 baseados em decisões verificadas (Súmula 443 TST, cotas/Lei 8.213, audiência digital/CF Art. 5º LV)
    - `diretrizesEticas`: título, pilares (Transparência, Supervisão, Segurança) e mandamentos_kern reescritos para jurisdição trabalhista
  - **Fonte da correção**: legado SEED_JUR_003_v2.0 gerado pelo JURIS_SEED_GENERATOR v1.0 com confiabilidade ALTA (4 decisões verificadas do TRT-9, período 2015–2026)

---

## [3.1.1] — 2026-05-04

### Correções Estruturais
- [FIX] agente_claude_code_expert_v1.0.json normalizado para seguir o padrão atual do sistema (Argus — Revisor do Sistema):
  - `versao.legado`: `"SEED_ENG_001_LEGACY_KERNEL"` → `"SHAW_AUDITOR_KERN_0XF1"`
  - `versao.semente_origem` renomeado para `versao.seed_utilizada`; valor corrigido de `"SEED_ENG_001_v1.0.json"` para `"SEED_ENG_001_v1.0"` (sem extensão, apenas o ID)
  - `versao.gerado_por` adicionado: `"Especialista v2.6.0-INTEGRATED"`
  - `nomeAgente` atualizado: `"Claude Code Expert (SEED_ENG_001 Legacy Legado)"` → `"Claude Code Expert (Kern: SEED_ENG_001)"` (padrão `Kern: ID`)
  - Bloco `logicaDatas` removido — exclusivo do Especialista, proibido em agentes gerados (CLAUDE.md)
  - `padraoEstrutura.blocosObrigatorios`: `"logicaDatas"` removido da lista
  - Bloco `referencias_semente` removido — campo não-padrão sem equivalente em nenhum outro agente do sistema
  - AGENTS_REGISTRY.json: campo `nota_estrutural` removido (anomalia corrigida)

---

## [3.1.0] — 2026-05-04

### Sementes
- [SEMENTE] SEED_SYS_001 v1.0 criada — legado sistêmico: sistemas multiagente, papel delimitado, comportamento emergente antecipado, dívida técnica explícita e governança de repositórios de agentes de IA.

### Agentes
- [AGENTE] revisor_sistema v1.0 gerado — auditor de saúde do sistema multiagente baseado no legado SEED_SYS_001_v1.0. Responsável por verificar consistência de registros, sobreposição de papéis, atualidade do CLAUDE.md e dívida técnica acumulada.

### Revisão do Sistema (Kern: SEED_SYS_001)
- [REVISAO] Auditoria completa do estado do repositório executada pelo revisor_sistema_v1.0.
- [FIX] SEEDS_REGISTRY.json: counter `total_sementes` corrigido de 7 para 9 (bug introduzido em v3.0.0 — legado SEED_JUR_003 não havia incrementado o counter).
- [DOCS] CLAUDE.md atualizado para refletir o estado real do sistema v3.1.0: escala atual (9 seeds, 10 agentes), cluster taxonomy, tipos de semente jurisprudencial, prefixo [REVISAO] na convenção de commits, anomalia legacy documentada.
- [DOCS] AGENTS_REGISTRY.json: nota_estrutural adicionada ao agente legacy agente_claude_code_expert_v1.0, documentando desvio de campos.
- [DOCS] versions/HEALTH_REPORT_v3.1.0.md gerado — relatório completo de saúde com inventário, análise de sobreposições, lacunas de cobertura, comportamentos emergentes documentados e recomendações priorizadas.

### Registries
- SEEDS_REGISTRY.json atualizado: 9 sementes indexadas
- AGENTS_REGISTRY.json atualizado: 10 agentes indexados

---

## [3.0.0] — 2026-05-04

### Sementes
- [SEMENTE] SEED_UX_001 v1.0 criada — legado de UX: evidence-based UX, experience gap, maturidade organizacional de design e discovery contínuo baseado em observação real de usuários.
- [SEMENTE] SEED_JUR_002 v1.0 criada — legado jurisprudencial: celeridade com profundidade, primazia da prova documental, dano moral com função pedagógica e conciliação como instrumento de justiça.
- [SEMENTE] SEED_JUR_004 v1.0 criada — legado trabalhista: primazia da realidade, boa-fé bilateral no contrato de trabalho, negociado sobre legislado com limites constitucionais e Convenções OIT como fonte supralegal.
- [SEMENTE] SEED_JUR_003 v2.0 integrada do branch jurisprudencial — legado jurisprudencial extraído de acórdãos públicos do TRT-9: vulnerabilidade como eixo decisório, ônus ao empregador, rescisão indireta como instrumento ativo, astreintes coercitivas e acesso à Justiça digital.

### Agentes
- [AGENTE] ux_validator v1.0 gerado — validador de decisões de UX baseado em evidência empírica, mapeamento de experience gaps e diagnóstico de maturidade organizacional de design. Legado: SEED_UX_001_v1.0.
- [AGENTE] juiz_everton v1.0 gerado — simulador de raciocínio judicial de juiz do TJPR em causas cíveis e consumeristas, com ênfase em prova documental e celeridade. Legado: SEED_JUR_002_v1.0.
- [AGENTE] juiza_rosemarie v1.0 gerado — simulador de raciocínio jurisprudencial de Desembargadora do TRT-9: vulnerabilidade, cotas, rescisão indireta, acesso à Justiça digital. Legado: SEED_JUR_003_v2.0.
- [AGENTE] advogado_mannrich v1.0 gerado — consultor trabalhista em Direito Individual e Coletivo do Trabalho, CLT, Reforma Trabalhista e Convenções OIT. Legado: SEED_JUR_004_v1.0.

### Registries
- SEEDS_REGISTRY.json atualizado: 8 legados indexados (SEED_AI_001, SEED_ENG_001, SEED_PM_001, SEED_JUR_001, SEED_UX_001, SEED_JUR_002, SEED_JUR_004, SEED_JUR_003)
- AGENTS_REGISTRY.json atualizado: 9 agentes indexados (consultor_ia, agente_claude_code_expert, arquiteto_produto, advogado_consumerista, juiz_jec, ux_validator, juiz_everton, juiza_rosemarie, advogado_mannrich)

---

## [2.8.0] — 2026-05-04

### Sementes
- [SEMENTE] SEED_JUR_001 v1.0 criada — legado consumerista: vulnerabilidade do consumidor, boa-fé objetiva e responsabilidade objetiva do fornecedor.

### Agentes
- [AGENTE] advogado_consumerista v1.0 gerado — consultor jurídico em Direito do Consumidor (CDC + JEC), baseado no legado SEED_JUR_001.
- [AGENTE] juiz_jec v1.0 gerado — simulador de raciocínio judicial do Juizado Especial Cível, baseado no legado SEED_JUR_001.

### Registries
- SEEDS_REGISTRY.json atualizado: 4 legados indexados (SEED_AI_001, SEED_ENG_001, SEED_PM_001, SEED_JUR_001)
- AGENTS_REGISTRY.json atualizado: 5 agentes indexados (consultor_ia, agente_claude_code_expert, arquiteto_produto, advogado_consumerista, juiz_jec)

---

## [2.7.0] — 2026-05-04

### Sementes
- [SEMENTE] SEED_PM_001 v1.0 criada — legado de produto: empowered teams, product discovery e outcome sobre output.

### Agentes
- [AGENTE] arquiteto_produto v1.0 gerado — consultor estratégico de produto baseado no legado SEED_PM_001.

### Registries
- SEEDS_REGISTRY.json atualizado: 3 legados indexados (SEED_AI_001, SEED_ENG_001, SEED_PM_001)
- AGENTS_REGISTRY.json atualizado: 3 agentes indexados (consultor_ia, agente_claude_code_expert, arquiteto_produto)

---

## [2.6.0] — 2026-04-20
[CONFIG] Especialista atualizado para v2.6.1-INTEGRATED


### Adicionado
- Configuração inicial do Especialista (Auditor Kern 0xF1) v2.6.0-INTEGRATED
- Configuração inicial do Semente de Shaw v1.1-RIGID
- Estrutura base do repositório
- Registries de sementes e agentes
- Documentação inicial

### Agentes Base
- config/especialista.json — Arquiteto Especialista
- config/semente.json — Semente de Shaw

---

## PRÓXIMAS VERSÕES

- [ ] Sistema de orquestração (comunicação automática entre agentes)
- [ ] Interface conversacional no Claude
- [ ] Primeiras sementes criadas
- [ ] Primeiros agentes gerados
