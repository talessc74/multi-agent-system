# Multi-Agent System

Sistema de múltiplos agentes de IA com comunicação automatizada, governança e versionamento completo.

## Agentes

### Especialista (Auditor Kern 0xF1)
Consultor sênior para criação, ajuste e evolução de agentes de IA.
- Interpreta a intenção do usuário
- Valida ética e segurança (Project Zero Mindset)
- Compila agentes prontos para uso em qualquer plataforma
- Pode incorporar sementes do Semente de Shaw

### Semente de Shaw (SHAW_ARCHITECT_GENERATOR)
Destilador de legado intelectual com busca em tempo real.
- Busca especialistas e referências na web
- Extrai axiomas verificáveis e inegociáveis
- Cria micro-legados lógicos em JSON
- Armazena sementes para reuso futuro

## Estrutura do Repositório

config/
- especialista.json: Definição do Especialista
- semente.json: Definição do Semente de Shaw

seeds/
- SEEDS_REGISTRY.json: Índice de todas as sementes

agents/
- AGENTS_REGISTRY.json: Índice de todos os agentes

versions/
- CHANGELOG.md: Histórico completo
- GOVERNANCE.md: Política de versionamento

prompts/
- ativar_especialista.md: Como usar o Especialista
- ativar_semente.md: Como usar o Semente

## Fluxo Principal

PASSO 1 - Criar Semente
Usuário → Semente de Shaw → Busca web → seeds/[nome]_v1.0.json

PASSO 2 - Criar Agente com Semente
Usuário + Semente → Especialista → agents/[nome]_v1.0.json

PASSO 3 - Usar Agente
JSON do agente → Copiar para Gemini / Copilot / Claude

## Governança

- Versionamento semântico (major.minor)
- Rastreabilidade total semente → agente
- Changelog obrigatório para toda mudança
- Segurança e ética acima da eficiência

Projeto privado — talessc74
