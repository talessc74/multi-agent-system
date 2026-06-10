# Processo de Concessão e Revogação de Acesso Beta

**Referência:** bdr-local-002  
**Versão:** 1.0  
**Data:** 2026-06-10

---

## Visão geral

Usuários beta (`accessLevel='beta'`) acessam todas as features do EAI? Jurídico
sem pagamento. Este acesso é gerenciado exclusivamente via Admin SDK no servidor —
nenhum usuário pode alterar seu próprio `accessLevel`.

---

## Concessão de acesso beta

### Quem pode conceder
Somente o administrador do projeto com acesso ao `ADMIN_SECRET`.

### Passo a passo

1. **Identificar o usuário**
   - Obter o `uid` Firebase do usuário (via Firebase Console → Authentication)
   - Confirmar que o usuário tem uma conta criada (`users/{uid}` existe no Firestore)

2. **Executar a chamada ao endpoint de admin**

```bash
curl -X POST https://[APP_URL]/api/admin/set-access-level \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -d '{
    "targetUid": "UID_DO_USUARIO",
    "newLevel": "beta",
    "reason": "Motivo da concessão — ex: usuário parceiro, testador"
  }'
```

3. **Verificar o log de auditoria**
   - O registro aparece na coleção `accessLevelAuditLog` no Firestore
   - Campos: `targetUid`, `previousLevel`, `newLevel`, `reason`, `changedAt`

4. **Confirmar com o usuário** (opcional, recomendado)
   - Informar por email ou canal acordado que o acesso beta foi ativado

---

## Revogação de acesso beta

Mesmo processo — `newLevel: "free"` e `reason` descrevendo o motivo da revogação.

```bash
curl -X POST https://[APP_URL]/api/admin/set-access-level \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -d '{
    "targetUid": "UID_DO_USUARIO",
    "newLevel": "free",
    "reason": "Período de beta encerrado"
  }'
```

---

## Revisão periódica

- **Frequência:** trimestral
- **Ação:** Revisar todos os registros com `accessLevel='beta'` no Firestore
- **Critério de revogação:** inatividade > 60 dias ou término de parceria
- **Registro:** Toda revogação deve ter `reason` preenchido no log de auditoria

---

## Auditoria

O log completo de alterações fica em `accessLevelAuditLog` no Firestore.
Para exportar:

```bash
# Via Firebase Admin SDK (script)
const logs = await adminDb.collection('accessLevelAuditLog')
  .orderBy('changedAt', 'desc')
  .get();
logs.forEach(doc => console.log(doc.data()));
```

---

## Segurança

- `ADMIN_SECRET` nunca é exposto em logs, commits ou código fonte
- O endpoint `/api/admin/set-access-level` retorna 401 para qualquer requisição sem o secret correto
- Toda chamada bem-sucedida gera log com `targetUid`, `changedAt` e `reason`
