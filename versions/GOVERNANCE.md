# GOVERNANCE — Política de Governança e Versionamento

## Princípios

1. Tudo é versionado. Nenhuma mudança acontece sem registro.
2. Nada se perde. O Git guarda todo o histórico.
3. Rastreabilidade total. Cada agente sabe de qual semente veio.
4. Segurança acima de tudo. Segue os mandamentos do Kern 0xF1.

## Padrão de Versionamento

Sementes: seeds/[nome_referencia]_v[major].[minor].json
- minor (+0.1): atualização da fonte, refinamento de axiomas
- major (+1.0): reestruturação completa da semente

Agentes: agents/[nome_agente]_v[major].[minor].json
- minor (+0.1): ajuste de comportamento, pequenas correções
- major (+1.0): mudança de semente base ou objetivo do agente

## Rastreabilidade Semente para Agente

Todo agente gerado deve registrar:
- seed_utilizada: ID e versão da semente usada
- data_criacao: data de geração
- gerado_por: Especialista (versão)

## Ciclo de Vida de uma Semente

1. Usuário solicita semente
2. Semente de Shaw busca na web (tempo real)
3. Cria JSON com required_fields
4. Salvo em seeds/ com versão
5. Registrado em SEEDS_REGISTRY.json
6. Disponível para Especialista ou Usuário

## Ciclo de Vida de um Agente

1. Usuário define intenção ao Especialista
2. Especialista recebe semente (se houver)
3. Compila JSON do novo agente
4. Salvo em agents/ com versão
5. Registrado em AGENTS_REGISTRY.json
6. Pronto para uso em qualquer plataforma

## Commits no GitHub

- [SEMENTE] nome_semente v1.0 criada
- [AGENTE] nome_agente v1.0 gerado
- [CONFIG] ajuste no Especialista/Semente
- [DOCS] atualização de documentação
- [FIX] correção em estrutura
