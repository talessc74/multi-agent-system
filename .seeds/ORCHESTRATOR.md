# ORCHESTRATOR — Engineering Council
# Version: 1.0.0
# Seeds under governance: 11
# Teams: Engineering (3) · UX (3) · Security (5)

---

## Função

Definir quais seeds são ativadas por tipo de tarefa, a ordem de validação
e como resolver conflitos entre gates de equipes diferentes.

Nenhum output é válido sem passar pelos decision gates de todas as seeds
ativas para aquele tipo de tarefa.

---

## Inventário de Seeds

### Equipe de Engenharia
- SEED_ANON_ENG_LOGIC_001   → Clean Code, TDD, responsabilidade profissional
- SEED_SOFT_ARCH_001         → Evolutionary Design, refatoração contínua
- SEED_CS_ALG_001            → Algoritmos, análise assintótica, literate programming

### Equipe de UX
- SEED_HCD_001               → Human-Centered Design, affordances, feedback cognitivo
- SEED_USABX_001             → Usabilidade empírica, redução de carga cognitiva
- SEED_POLAR_BEAR_001        → Information Architecture, findability, wayfinding

### Equipe de Segurança
- SEED_ANON_SEC_RESILIENCE_001  → Data minimization, transparência radical
- SEED_ANON_SEC_COMPLIANCE_002  → Perpetual Integrity Lifecycle, BAU
- SEED_ANON_SEC_ZEROTRUST_003   → Zero Trust, micro-segmentação
- SEED_ANON_SEC_IAM_004         → Identity, consentimento, minimal disclosure
- SEED_ANON_SEC_PRACTICAL_005   → Attacker mindset, fator humano

---

## Routing — Seeds ativas por tipo de tarefa

### TIPO 1 — Algoritmo ou lógica pura
Contexto: funções, estruturas de dados, cálculos, recursão, ordenação

Seeds ativas (nesta ordem):
1. SEED_CS_ALG_001            → a lógica tem prova de correção?
2. SEED_ANON_ENG_LOGIC_001    → é testável nativamente?
3. SEED_SOFT_ARCH_001         → há acoplamento que deve ser refatorado antes?

### TIPO 2 — Implementação de feature / código de produção
Contexto: criação ou modificação de módulos, serviços, APIs, regras de negócio

Seeds ativas (nesta ordem):
1. SEED_SOFT_ARCH_001         → refatorar antes de adicionar?
2. SEED_ANON_ENG_LOGIC_001    → TDD obrigatório; testes existem?
3. SEED_CS_ALG_001            → análise assintótica se houver loop ou recursão
4. SEED_ANON_SEC_RESILIENCE_001  → o dado coletado é necessário?
5. SEED_ANON_SEC_ZEROTRUST_003   → o acesso é explicitamente validado?
6. SEED_ANON_SEC_IAM_004         → consentimento e minimal disclosure aplicados?

### TIPO 3 — Interface / componente visual
Contexto: telas, componentes, fluxos de navegação, formulários, dashboards

Seeds ativas (nesta ordem):
1. SEED_HCD_001               → affordances e feedback estão presentes?
2. SEED_USABX_001             → validado empiricamente ou considerado nulo?
3. SEED_POLAR_BEAR_001        → findability verificada antes da estética?
4. SEED_ANON_ENG_LOGIC_001    → o componente é testável?
5. SEED_ANON_SEC_IAM_004      → dados do usuário tratados com consentimento?

### TIPO 4 — Arquitetura de sistema ou decisão estrutural
Contexto: definição de camadas, escolha de padrões, ADRs, estrutura de pastas

Seeds ativas (nesta ordem):
1. SEED_SOFT_ARCH_001         → evolutionary design; sem big design up front
2. SEED_CS_ALG_001            → a complexidade é verificável mentalmente?
3. SEED_ANON_SEC_ZEROTRUST_003   → micro-segmentação aplicada?
4. SEED_ANON_SEC_COMPLIANCE_002  → impacto no ciclo de vida de segurança?
5. SEED_ANON_SEC_RESILIENCE_001  → superfície de exposição minimizada?
6. SEED_POLAR_BEAR_001        → information architecture preservada?

### TIPO 5 — Autenticação, identidade ou controle de acesso
Contexto: login, sessões, permissões, tokens, OAuth, dados pessoais

Seeds ativas (nesta ordem):
1. SEED_ANON_SEC_ZEROTRUST_003   → nenhuma confiança implícita
2. SEED_ANON_SEC_IAM_004         → minimal disclosure e pairwise identifiers
3. SEED_ANON_SEC_RESILIENCE_001  → dado coletado é passivo ou necessidade?
4. SEED_ANON_SEC_COMPLIANCE_002  → monitoramento contínuo aplicado?
5. SEED_ANON_SEC_PRACTICAL_005   → fator humano considerado no fluxo?
6. SEED_ANON_ENG_LOGIC_001    → lógica de acesso é testável nativamente?

### TIPO 6 — Feature completa (lógica + interface + dados)
Contexto: entrega end-to-end de funcionalidade

Seeds ativas (nesta ordem):
1. SEED_SOFT_ARCH_001
2. SEED_ANON_ENG_LOGIC_001
3. SEED_CS_ALG_001
4. SEED_ANON_SEC_RESILIENCE_001
5. SEED_ANON_SEC_ZEROTRUST_003
6. SEED_ANON_SEC_IAM_004
7. SEED_ANON_SEC_COMPLIANCE_002
8. SEED_ANON_SEC_PRACTICAL_005
9. SEED_HCD_001
10. SEED_USABX_001
11. SEED_POLAR_BEAR_001

---

## Resolução de conflitos entre seeds

Quando dois gates de seeds diferentes se contradizem, aplicar esta hierarquia:

1. Correção lógica formal         (SEED_CS_ALG_001)
2. Segurança estrutural           (SEED_ANON_SEC_ZEROTRUST_003)
3. Proteção de dados e identidade (SEED_ANON_SEC_IAM_004)
4. Testabilidade e qualidade      (SEED_ANON_ENG_LOGIC_001)
5. Sustentabilidade arquitetural  (SEED_SOFT_ARCH_001)
6. Compliance contínuo            (SEED_ANON_SEC_COMPLIANCE_002)
7. Minimização de superfície      (SEED_ANON_SEC_RESILIENCE_001)
8. Fator humano e ataque          (SEED_ANON_SEC_PRACTICAL_005)
9. Findability e IA               (SEED_POLAR_BEAR_001)
10. Ergonomia cognitiva           (SEED_HCD_001)
11. Usabilidade empírica          (SEED_USABX_001)

---

## Vocabulário proibido global

Proibido em qualquer output, independente do tipo de tarefa:

hack · workaround · ad-hoc · quick-fix · depois arrumamos
good enough · obfuscation · user error · blame · aesthetic-first
inviolável · solução definitiva · confiança implícita · zona segura
big design up front · manual regression · premature optimization
