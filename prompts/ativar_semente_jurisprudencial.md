# Como Ativar a Semente Jurisprudencial

## Quando usar este agente

A Semente Jurisprudencial é diferente da Semente de Shaw.

| Semente de Shaw (`config/semente.json`) | Semente Jurisprudencial (`config/semente_jurisprudencial.json`) |
|---|---|
| Destila legado intelectual declarado (livros, palestras, artigos) | Destila padrões decisórios inferidos de acórdãos e decisões reais |
| Funciona para qualquer especialista ou domínio | Funciona apenas para magistrados brasileiros |
| Gera `kernel_logic` | Gera `kernel_jurisprudencial` |
| Padrão: o que o especialista diz | Padrão: o que o magistrado FAZ nas decisões |

**Use a Semente Jurisprudencial quando quiser modelar como um juiz, desembargador ou ministro decide na prática.**

---

## Prompt Base

```
Ative a Semente Jurisprudencial (JURIS_SEED_GENERATOR) conforme config/semente_jurisprudencial.json.

Quero uma semente jurisprudencial de: [NOME DO MAGISTRADO]
Tribunal/Vara: [TRIBUNAL E CÂMARA/TURMA/VARA SE SOUBER]
Área de foco: [ÁREA DO DIREITO — ex: consumidor, bancário, trabalhista, família]
Período: [opcional — ex: 2018–2024]
```

---

## Exemplos de Prompts

```
Ative a Semente Jurisprudencial. Quero uma semente de:
Magistrado: Herman Benjamin
Tribunal: STJ — 2ª Turma
Área: Direito Ambiental e do Consumidor
Período: 2015–2024
```

```
Ative a Semente Jurisprudencial. Quero uma semente de:
Magistrado: Luís Roberto Barroso
Tribunal: STF
Área: Direitos Fundamentais e Controle de Constitucionalidade
```

```
Ative a Semente Jurisprudencial. Quero uma semente de:
Magistrado: Nancy Andrighi
Tribunal: STJ — 3ª Turma
Área: Direito de Família e Responsabilidade Civil
```

---

## O que a Semente retorna

Um JSON com os campos obrigatórios:

- `seed_id`: identificador único (nome do magistrado em snake_case)
- `seed_version`: versão da semente
- `seed_date`: data de criação
- `seed_tipo`: sempre `"jurisprudencial"`
- `referencia_fonte`: tribunal, câmara/turma, período analisado e nota de rastreabilidade
- `kernel_jurisprudencial`: axiomas extraídos de padrões decisórios reais (mínimo 3 decisões)
- `decisoes_reais_analisadas`: array com as decisões que sustentam o kernel (tribunal, tema, ratio decidendi, padrão extraído)
- `padroes_identificados`: padrões comportamentais inferidos com frequência observada
- `decision_gates`: regras If/Then refletindo os gatilhos decisórios reais
- `vocabulary_filter`: termos que o magistrado usa e evita nas decisões reais
- `semantic_anchor`: âncora semântica central do padrão decisório
- `confiabilidade_kernel`: grau de saturação da amostra (ALTA / MEDIA / BAIXA)

---

## Comportamento de fallback

Se o agente encontrar **menos de 3 decisões verificáveis** na área solicitada, ele **não gera a semente** e responde:

> DADOS INSUFICIENTES: Foram localizadas apenas [N] decisão(ões) públicas verificáveis...

Nesse caso, você pode:
1. Ampliar o escopo temporal da busca
2. Ampliar para temas correlatos
3. Prosseguir com ressalva explícita de baixa confiabilidade

**Nunca force o agente a gerar uma semente com dados insuficientes.** Sementes contaminadas corrompem os agentes gerados a partir delas.

---

## Diferença entre padrão real e padrão declarado

A Semente Jurisprudencial extrai apenas **padrões reais** — o que as decisões demonstram que o magistrado faz, não o que ele diz que faz.

Quando um magistrado declara em entrevista que "sempre aplica o CDC de forma ampliativa" mas suas decisões mostram que restringe a aplicação em casos de pessoa jurídica, **o padrão real prevalece** e a divergência é documentada.

---

## Após receber a semente

1. Salve o JSON em `seeds/[nome_magistrado]_v1.0.json`
2. Atualize `seeds/SEEDS_REGISTRY.json` (incrementar `total_sementes`, adicionar entrada no array `sementes`)
3. Faça commit: `[SEMENTE] nome_magistrado v1.0 criada`
4. Para gerar o agente correspondente, ative o Especialista com `prompts/ativar_especialista.md` passando a semente gerada

---

## Fontes consultadas pelo agente

O JURIS_SEED_GENERATOR busca exclusivamente em fontes públicas verificáveis:

- **Jusbrasil** — acórdãos e ementas indexados
- **Portais dos TJs estaduais** — TJPR, TJSP (e-SAJ), TJRS, TJRJ, TJMG e demais
- **STJ** — pesquisa de jurisprudência (stj.jus.br)
- **STF** — jurisprudência e acórdãos (stf.jus.br)
- **DJe** — Diário da Justiça Eletrônico dos respectivos tribunais

Fontes não rastreáveis (blogs sem referência, resumos sem número de processo, opiniões doutrinárias) são **explicitamente proibidas**.
