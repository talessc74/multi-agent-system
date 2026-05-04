# CHANGELOG — Multi-Agent System

Todos os registros de versões, mudanças e decisões do projeto.

---

## [3.1.2] — 2026-05-04

### Correções Estruturais (Argus — Revisor do Sistema)

- [FIX] `agents/juiza_rosemarie_v1.0.json` corrigido integralmente — erro factual crítico detectado pelo JURIS_SEED_GENERATOR na branch `semente-jurisprudencial` e corrigido por Argus na main:
  - **Erro**: agente v1.0.0 foi gerado a partir do seed v2.0, que identificava incorretamente Rosemarie Diedrichs Pimpão como "Ministra do STJ — 4ª Turma e 2ª Seção"
  - **Fato verificado**: ela é Desembargadora Federal do Trabalho do TRT-9 desde 11/11/1996 — nunca integrou o STJ
  - **Campos corrigidos**:
    - `nomeAgente`: `"Ministra Rosemarie — STJ..."` → `"Desembargadora Rosemarie — TRT-9..."`
    - `versao.numero`: `"1.0.0"` → `"1.1.0"` (major minor bump por correção de conteúdo)
    - `versao.seed_utilizada`: `"rosemarie_diedrichs_pimpao_v2.0"` → `"rosemarie_diedrichs_pimpao_v3.0"`
    - `versao.tipo`: STJ/civil → TRT-9/trabalhista
    - `versao.nota_correcao`: campo adicionado com rastreabilidade do erro e da correção
    - `objetivo`: STJ/consumidor/bancos → TRT-9/trabalhista/dispensa discriminatória/reintegração/rescisão indireta
    - `kernel_logic.philosophy` e `kernel_logic.axiomas`: 6 axiomas STJ/consumidor → 6 axiomas trabalhistas baseados no seed v3.0 (vulnerabilidade, ônus ao empregador, acesso à Justiça digital, rescisão indireta, astreintes)
    - `logicaArquivos` completo: objetivo, densidade mínima e 3 entregáveis reescritos para direito trabalhista
    - `logicaInterpretacao.revisaoAutomatica.etapas`: 6 etapas STJ → 6 etapas TRT-9 (competência, vulnerabilidade, Súmula 443, rescisão indireta, acesso à Justiça digital, sanção)
    - `logicaInterpretacao.coreTraits`: 5 traits STJ/consumidor → 5 traits TRT-9/trabalhista
    - `instrucoesEspecificas.mainObjective`, `.restricoes` (5), `.analysisProcess.steps` (6): todos reescritos para direito trabalhista
    - `instrucoesEspecificas.exemplos_de_prompts_validados`: 3 casos STJ/consumidor substituídos por 3 casos TRT-9 baseados em decisões verificadas (câncer/Súmula 443, cotas/Lei 8.213, audiência digital/CF Art. 5º LV)
    - `diretrizesEticas`: título, pilares (Transparência, Supervisão, Segurança) e mandamentos_kern reescritos para jurisdição trabalhista
  - **Fonte da correção**: seed `rosemarie_diedrichs_pimpao_v3.0` gerado pelo JURIS_SEED_GENERATOR v1.0 com confiabilidade ALTA (4 decisões verificadas do TRT-9, período 2015–2026)

---

## [3.1.1] — 2026-05-04

### Correções Estruturais
- [FIX] agente_claude_code_expert_v1.0.json normalizado para seguir o padrão atual do sistema (Argus — Revisor do Sistema):
  - `versao.kernel`: `"BORIS_CHERNY_LEGACY_KERNEL"` → `"SHAW_AUDITOR_KERN_0XF1"`
  - `versao.semente_origem` renomeado para `versao.seed_utilizada`; valor corrigido de `"boris_cherny_v1.0.json"` para `"boris_cherny_v1.0"` (sem extensão, apenas o ID)
  - `versao.gerado_por` adicionado: `"Especialista v2.6.0-INTEGRATED"`
  - `nomeAgente` atualizado: `"Claude Code Expert (Boris Cherny Legacy Kernel)"` → `"Claude Code Expert (Kern: Boris Cherny)"` (padrão `Kern: Nome`)
  - Bloco `logicaDatas` removido — exclusivo do Especialista, proibido em agentes gerados (CLAUDE.md)
  - `padraoEstrutura.blocosObrigatorios`: `"logicaDatas"` removido da lista
  - Bloco `referencias_semente` removido — campo não-padrão sem equivalente em nenhum outro agente do sistema
  - AGENTS_REGISTRY.json: campo `nota_estrutural` removido (anomalia corrigida)

---

## [3.1.0] — 2026-05-04

### Sementes
- [SEMENTE] yoav_shoham v1.0 criada — destilação do legado de Yoav Shoham (Stanford/AI21 Labs): sistemas multiagente, papel delimitado, comportamento emergente antecipado, dívida técnica explícita e governança de repositórios de agentes de IA.

### Agentes
- [AGENTE] revisor_sistema v1.0 gerado — auditor de saúde do sistema multiagente baseado na semente yoav_shoham_v1.0. Responsável por verificar consistência de registros, sobreposição de papéis, atualidade do CLAUDE.md e dívida técnica acumulada.

### Revisão do Sistema (Kern: Yoav Shoham)
- [REVISAO] Auditoria completa do estado do repositório executada pelo revisor_sistema_v1.0.
- [FIX] SEEDS_REGISTRY.json: counter `total_sementes` corrigido de 7 para 9 (bug introduzido em v3.0.0 — seed rosemarie não havia incrementado o counter).
- [DOCS] CLAUDE.md atualizado para refletir o estado real do sistema v3.1.0: escala atual (9 seeds, 10 agentes), cluster taxonomy, tipos de semente jurisprudencial, prefixo [REVISAO] na convenção de commits, anomalia legacy documentada.
- [DOCS] AGENTS_REGISTRY.json: nota_estrutural adicionada ao agente legacy agente_claude_code_expert_v1.0, documentando desvio de campos (semente_origem vs seed_utilizada, BORIS_CHERNY_LEGACY_KERNEL vs SHAW_AUDITOR_KERN_0XF1).
- [DOCS] versions/HEALTH_REPORT_v3.1.0.md gerado — relatório completo de saúde com inventário, análise de sobreposições, lacunas de cobertura, comportamentos emergentes documentados e recomendações priorizadas.

### Registries
- SEEDS_REGISTRY.json atualizado: 9 sementes indexadas
- AGENTS_REGISTRY.json atualizado: 10 agentes indexados

---

## [3.0.0] — 2026-05-04

### Sementes
- [SEMENTE] jared_spool v1.0 criada — destilação do legado de Jared Spool (UIE/Center Centre): evidence-based UX, experience gap, maturidade organizacional de design e discovery contínuo baseado em observação real de usuários.
- [SEMENTE] everton_goncalves_dutra v1.0 criada — semente jurisprudencial extraída de decisões públicas do TJPR: celeridade com profundidade, primazia da prova documental, dano moral com função pedagógica e conciliação como instrumento de justiça.
- [SEMENTE] nelson_mannrich v1.0 criada — destilação do legado de Nelson Mannrich (USP/TST): primazia da realidade, boa-fé bilateral no contrato de trabalho, negociado sobre legislado com limites constitucionais e Convenções OIT como fonte supralegal.
- [SEMENTE] rosemarie_diedrichs_pimpao v2.0 integrada do branch jurisprudencial — semente de tipo jurisprudencial extraída de acórdãos públicos do STJ (4ª Turma e 2ª Seção): expectativa legítima, dano moral in re ipsa, boa-fé contratual bilateral e acesso à Justiça como cláusula protetiva.

### Agentes
- [AGENTE] ux_validator v1.0 gerado — validador de decisões de UX baseado em evidência empírica, mapeamento de experience gaps e diagnóstico de maturidade organizacional de design. Semente: jared_spool_v1.0.
- [AGENTE] juiz_everton v1.0 gerado — simulador de raciocínio judicial de juiz do TJPR em causas cíveis e consumeristas, com ênfase em prova documental e celeridade. Semente: everton_goncalves_dutra_v1.0.
- [AGENTE] juiza_rosemarie v1.0 gerado — simulador de raciocínio jurisprudencial da Ministra Rosemarie Diedrichs Pimpão (STJ 4ª Turma/2ª Seção): expectativa legítima, contratos bancários e seguros, dano moral com função pedagógica. Semente: rosemarie_diedrichs_pimpao_v2.0.
- [AGENTE] advogado_mannrich v1.0 gerado — consultor trabalhista em Direito Individual e Coletivo do Trabalho, CLT, Reforma Trabalhista e Convenções OIT. Semente: nelson_mannrich_v1.0.

### Registries
- SEEDS_REGISTRY.json atualizado: 8 sementes indexadas (andrew_ng, boris_cherny, marty_cagan, claudia_lima_marques, jared_spool, everton_goncalves_dutra, nelson_mannrich, rosemarie_diedrichs_pimpao)
- AGENTS_REGISTRY.json atualizado: 9 agentes indexados (consultor_ia, agente_claude_code_expert, arquiteto_produto, advogado_consumerista, juiz_jec, ux_validator, juiz_everton, juiza_rosemarie, advogado_mannrich)

---

## [2.8.0] — 2026-05-04

### Sementes
- [SEMENTE] claudia_lima_marques v1.0 criada — destilação do legado de Cláudia Lima Marques (UFRGS/SVPG): vulnerabilidade do consumidor, boa-fé objetiva e responsabilidade objetiva do fornecedor.

### Agentes
- [AGENTE] advogado_consumerista v1.0 gerado — consultor jurídico em Direito do Consumidor (CDC + JEC), baseado na semente Cláudia Lima Marques.
- [AGENTE] juiz_jec v1.0 gerado — simulador de raciocínio judicial do Juizado Especial Cível, baseado na semente Cláudia Lima Marques.

### Registries
- SEEDS_REGISTRY.json atualizado: 4 sementes indexadas (andrew_ng, boris_cherny, marty_cagan, claudia_lima_marques)
- AGENTS_REGISTRY.json atualizado: 5 agentes indexados (consultor_ia, agente_claude_code_expert, arquiteto_produto, advogado_consumerista, juiz_jec)

---

## [2.7.0] — 2026-05-04

### Sementes
- [SEMENTE] marty_cagan v1.0 criada — destilação do legado de Marty Cagan (SVPG): empowered teams, product discovery e outcome sobre output.

### Agentes
- [AGENTE] arquiteto_produto v1.0 gerado — consultor estratégico de produto baseado na semente Marty Cagan.

### Registries
- SEEDS_REGISTRY.json atualizado: 3 sementes indexadas (andrew_ng, boris_cherny, marty_cagan)
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
