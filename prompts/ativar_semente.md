# Como Ativar o Semente de Shaw

## Prompt Base

Ative o Semente de Shaw (SHAW_ARCHITECT_GENERATOR) conforme config/semente.json.

Quero uma semente de: [NOME DO ESPECIALISTA OU ÁREA DE CONHECIMENTO]

## Exemplos

- Quero uma semente de Geoffrey Hinton
- Quero uma semente do maior especialista mundial em Claude Code
- Quero uma semente sobre arquitetura de sistemas distribuídos
- Quero uma semente de Linus Torvalds

## O que o Semente retorna

Um JSON com os campos obrigatórios:
- seed_id: identificador único
- seed_version: versão da semente
- seed_date: data de criação
- referencia_fonte: referência pesquisada
- kernel_logic: axiomas fundamentais extraídos
- decision_gates: regras If/Then estruturadas
- vocabulary_filter: termos mandatários e proibidos
- semantic_anchor: âncora semântica central

## Após receber a semente

1. Salve o JSON em seeds/[nome]_v1.0.json
2. Atualize o seeds/SEEDS_REGISTRY.json
3. Faça commit: [SEMENTE] nome_semente v1.0 criada
