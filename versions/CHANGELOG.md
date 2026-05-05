# CHANGELOG — Multi-Agent System

Todos os registros de versões, mudanças e decisões do projeto.

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
