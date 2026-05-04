# CHANGELOG — Multi-Agent System

Todos os registros de versões, mudanças e decisões do projeto.

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
