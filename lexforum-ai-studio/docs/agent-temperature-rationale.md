# Critérios de Temperatura por Tipo de Agente — EAI?

**Versão:** 1.0  
**Data:** 21/05/2026  
**Responsável:** Arch (SEED_ARCH_001)

---

## Filosofia

Temperatura no Gemini controla o grau de aleatoriedade da resposta.
Quanto menor, mais determinístico e consistente. Quanto maior, mais
criativo e variado.

No EAI?, cada tipo de agente tem uma função diferente — e portanto
um "humor" ideal diferente.

---

## Escala Adotada

| Tipo de Agente | Temperature | Razão |
|----------------|-------------|-------|
| Validação (validateCausaServer) | 0.2 | Máxima previsibilidade — classifica área e extrai dados estruturados |
| Geração de agente (getOrGenerateAgent) | 0.4 | Criativo o suficiente para gerar perfis variados, conservador o suficiente para não inventar |
| Juiz (todos os modos) | 0.3 | Consistência técnica — decisões jurídicas exigem coerência e fundamentação sólida |
| Brief estratégico | 0.5 | Equilibrado — precisa de síntese criativa mas baseada em fatos da rodada |
| Advogado (todos os modos) | 0.65 | Criatividade argumentativa — advogado deve buscar ângulos novos a cada rodada |
| Relatório leigo | 0.2 | Linguagem clara e previsível — sem variação estilística inesperada |
| Relatório profissional | 0.2 | Fundamentação técnica — consistência é mais valiosa que criatividade |
| Juiz Estrategista (Modo 5) | 0.3 | Mesmo critério do juiz — avaliação técnica exige coerência |

---

## Princípio Orientador

> Use o modelo mais previsível que resolve o problema.
> Criatividade só onde ela entrega valor real ao usuário.

Advogados se beneficiam de variação — encontrar ângulos novos é parte
do valor. Juízes e relatórios não — consistência e rigor técnico são
o que o usuário espera.

---

## Revisão

Reavaliar após 500 simulações ou quando houver mudança de modelo base.
Próxima revisão sugerida: agosto/2026.

---
