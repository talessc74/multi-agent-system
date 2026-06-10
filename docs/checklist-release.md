# Checklist de Release — Staging → Produção

**Referência:** bdr-local-003  
**Versão:** 1.0  
**Data:** 2026-06-10

---

## Antes de iniciar o release

- [ ] `git log --oneline -5` — confirmar que os commits são atômicos e descritivos
- [ ] Branch de feature não tem mudanças não commitadas (`git status`)
- [ ] PR aberto e revisado (se aplicável)

---

## Validação em Staging

### Configuração

- [ ] Confirmar que `eai-staging` usa chave Stripe **test mode** (não live)
- [ ] Confirmar que `eai-staging` usa chave Gemini `VnFQ` (projeto LexForum) — não a chave de produção
- [ ] Variáveis de ambiente de staging **não** contêm secrets de produção

### Testes automatizados

- [ ] `npm run test` passa sem erros no branch
- [ ] `npm run lint` sem erros TypeScript

### Sessão exploratória (mínimo 15 minutos — PROBE)

Cobrir os 3 fluxos prioritários (Pareto):

**Fluxo 1 — Simulação e pagamento**
- [ ] Criar nova simulação com caso jurídico real (> 100 palavras)
- [ ] Verificar que o laudo é exibido censurado (60%) para usuário não logado
- [ ] Fazer login com Google
- [ ] Iniciar pagamento via Stripe test (`4242 4242 4242 4242`, validade futura, CVC qualquer)
- [ ] Confirmar que o laudo completo é liberado após pagamento
- [ ] Verificar que a simulação aparece no histórico do usuário

**Fluxo 2 — Chat pós-sessão**
- [ ] Após simulação paga, abrir o chat
- [ ] Para usuário beta: confirmar que o chat abre sem solicitar pagamento
- [ ] Para usuário free: confirmar que o fluxo de pagamento do chat (R$ 2,99 test) funciona
- [ ] Enviar 2 mensagens e verificar respostas do agente
- [ ] Verificar indicador de perguntas restantes

**Fluxo 3 — Autenticação**
- [ ] Login com Google funciona
- [ ] Logout funciona
- [ ] Usuário não logado não acessa histórico de simulações

**Edge cases a explorar**
- [ ] Cancelar o pagamento Stripe — app retorna ao estado correto?
- [ ] Digitar caso muito curto — validação exibe feedback claro?
- [ ] Abrir chat em sessão sem pagamento — erro claro ou redirecionamento?

---

## Merge em main e deploy

- [ ] Sessão exploratória concluída sem bloqueadores
- [ ] Merge do PR / push para `main`
- [ ] Verificar Cloud Build dispara automaticamente (`cloudbuild.yaml`)
- [ ] Aguardar build concluir com sucesso no GCP Console

---

## Validação em Produção (pós-deploy)

- [ ] Acessar `eaijuridico.com.br` e verificar que a versão nova está ativa
- [ ] Criar uma simulação de smoke test (caso genérico, sem pagamento real)
- [ ] Verificar que o laudo é gerado sem erro
- [ ] Confirmar que não há erros no Cloud Run Logs (`gcloud run services logs read eai-producao`)

---

## Em caso de falha pós-deploy

1. Identificar o erro nos logs do Cloud Run
2. Avaliar se é hotfix rápido ou rollback necessário
3. Se rollback: `gcloud run services update-traffic eai-producao --to-revisions=REVISION_ANTERIOR=100`
4. Registrar o incidente (mesmo que menor) com causa e solução

---

## Assinatura do release

Preencher ao concluir:

- **Data/hora do deploy:** ___________
- **Branch/commit deployado:** ___________
- **Responsável:** ___________
- **Resultado da sessão exploratória:** ___________
- **Observações:** ___________
