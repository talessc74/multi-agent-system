# Plano de Resposta a Incidente de Segurança

**Referência:** bdr-local-001  
**Versão:** 1.0  
**Data:** 2026-06-10

---

## Definição de incidente

Um incidente de segurança é qualquer evento que comprometa ou ameace comprometer:
- **Confidencialidade:** acesso não autorizado a dados de usuários
- **Integridade:** modificação não autorizada de dados ou código
- **Disponibilidade:** indisponibilidade do serviço por ataque (ex: DoS)
- **Autenticidade:** comprometimento de credenciais ou tokens

---

## Classificação por severidade

| Nível | Descrição | Tempo de resposta |
|-------|-----------|-------------------|
| **P0 — Crítico** | Vazamento de dados de usuários, chave comprometida em produção, pagamento fraudado | Imediato (< 1h) |
| **P1 — Alto** | Acesso não autorizado a Firestore, falha de autenticação, indisponibilidade > 30min | < 4h |
| **P2 — Médio** | Tentativas de brute-force detectadas, anomalia de quota inesperada | < 24h |
| **P3 — Baixo** | Configuração incorreta sem impacto imediato, vulnerabilidade teórica | < 7 dias |

---

## Fluxo de resposta

### Fase 1 — Contenção (Minutos a horas)

1. **Identificar o vetor de ataque** — o que foi comprometido?
2. **Isolar imediatamente:**
   - Chave comprometida → rotacionar no GCP Secret Manager
   - Serviço comprometido → desabilitar Cloud Run
   - Firestore exposto → rever Security Rules e aplicar via `firebase deploy --only firestore:rules`
3. **Preservar evidências** — não deletar logs antes de investigar
4. **Notificar internamente** — registro de incidente com timestamp

### Fase 2 — Investigação (Horas)

1. Identificar escopo: quais dados, quantos usuários, qual período
2. Determinar causa raiz: código? configuração? engenharia social?
3. Verificar se o incidente ainda está ativo

### Fase 3 — Notificação (< 72h para P0/P1)

**ANPD (Agência Nacional de Proteção de Dados):**
- Portal: gov.br/anpd
- Prazo: 72h a partir da ciência
- Conteúdo: natureza dos dados, estimativa de titulares afetados, medidas adotadas

**Usuários afetados:**
- Notificação por email via Resend
- Linguagem clara: o que aconteceu, quais dados, o que foi feito, o que o usuário deve fazer
- Sem eufemismos, sem downplay

### Fase 4 — Remediação (Dias)

1. Corrigir a causa raiz no código/configuração
2. Deploy via pipeline staging → produção (exceto P0 com deploy direto documentado)
3. Verificar ausência de regressão

### Fase 5 — Post-mortem (< 48h após contenção)

Documento com:
- Timeline do incidente
- Causa raiz identificada
- Impacto real (dados, usuários, tempo de indisponibilidade)
- O que funcionou na resposta
- O que falhou
- Ações preventivas para não repetir

---

## Ações imediatas por tipo de incidente

### Chave de API comprometida (Gemini, Stripe, Firebase)

```bash
# 1. Rotacionar chave no GCP
gcloud secrets versions add [SECRET_NAME] --data-file=nova-chave.json

# 2. Revogar versão anterior
gcloud secrets versions disable [VERSION] --secret=[SECRET_NAME]

# 3. Redeploy forçado no Cloud Run
gcloud run deploy [SERVICE] --region=us-central1 --project=[PROJECT]
```

### Regras Firestore expostas

```bash
# Deploy imediato das rules corrigidas
firebase deploy --only firestore:rules --project=[PROJECT_ID]
```

### Conta Firebase Admin comprometida

1. Revogar credenciais no GCP IAM
2. Gerar nova service account
3. Atualizar secret no Secret Manager
4. Redeploy do Cloud Run

---

## Contatos de emergência

| Recurso | Onde |
|---------|------|
| Firebase Console | console.firebase.google.com |
| GCP Console | console.cloud.google.com |
| Stripe Dashboard | dashboard.stripe.com |
| ANPD | gov.br/anpd |
| Status GCP | status.cloud.google.com |

---

## Exercício de resposta

Simular um incidente P1 fictício a cada 6 meses para testar o plano.
Documentar os resultados do exercício e atualizar este plano.
