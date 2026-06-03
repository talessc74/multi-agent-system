# Governance System — Engineering Council

## Instrução obrigatória

Este projeto opera sob um sistema de seeds de governança distribuído
em três equipes: Engenharia, UX e Segurança.

Antes de iniciar qualquer tarefa, leia integralmente:
  .seeds/ORCHESTRATOR.md

O Orchestrator define quais seeds são ativadas para cada tipo de tarefa
e a ordem de validação obrigatória.

## Regra absoluta

Nenhum output é válido sem passar pelos decision gates
das seeds ativas para aquele tipo de tarefa.

## Seeds disponíveis

### Engenharia
- .seeds/SEED_ANON_ENG_LOGIC_001.json
- .seeds/SEED_SOFT_ARCH_001.json
- .seeds/SEED_CS_ALG_001.json

### UX
- .seeds/SEED_HCD_001.json
- .seeds/SEED_USABX_001.json
- .seeds/SEED_POLAR_BEAR_001.json

### Segurança
- .seeds/SEED_ANON_SEC_RESILIENCE_001.json
- .seeds/SEED_ANON_SEC_COMPLIANCE_002.json
- .seeds/SEED_ANON_SEC_ZEROTRUST_003.json
- .seeds/SEED_ANON_SEC_IAM_004.json
- .seeds/SEED_ANON_SEC_PRACTICAL_005.json
