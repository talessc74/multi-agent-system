/**
 * Backfill script — corrige createdAt corrompido nas simulações
 *
 * Contexto: sanitize() destruía FieldValue sentinels, salvando {} no lugar de
 * serverTimestamp(). Este script usa o Admin SDK para recuperar o createTime
 * real de cada documento (metadado interno do Firestore) e gravá-lo no campo
 * createdAt como Timestamp.
 *
 * Uso:
 *   1. Baixe a service account key no Firebase Console:
 *      Project Settings → Service accounts → Generate new private key
 *   2. Salve como: lexforum-ai-studio/scripts/service-account.json
 *   3. node scripts/backfill-createdAt.js
 *
 * IMPORTANTE: Execute uma vez só. Idempotente (pula docs que já têm Timestamp válido).
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function isValidTimestamp(value) {
  if (!value) return false;
  // Firestore Timestamp tem _seconds e _nanoseconds e não é {}
  if (typeof value !== 'object') return false;
  if (value instanceof admin.firestore.Timestamp) return true;
  // Detecta {} ou objeto vazio (o bug)
  const keys = Object.keys(value);
  return keys.includes('_seconds') || keys.includes('seconds');
}

async function backfill() {
  console.log('Iniciando backfill de createdAt...\n');

  const snap = await db.collection('simulations').get();

  if (snap.empty) {
    console.log('Nenhum documento encontrado.');
    return;
  }

  let total = 0;
  let fixed = 0;
  let skipped = 0;
  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH = 400; // Firestore limit: 500 writes per batch

  for (const docSnap of snap.docs) {
    total++;
    const data = docSnap.data();
    const currentCreatedAt = data.createdAt;
    const valid = await isValidTimestamp(currentCreatedAt);

    if (valid) {
      skipped++;
      continue;
    }

    // Usar o createTime real do documento (metadado interno do Firestore)
    const realCreateTime = docSnap.createTime; // admin.firestore.Timestamp

    console.log(`  Corrigindo: ${docSnap.id}`);
    console.log(`    createTime real: ${realCreateTime.toDate().toISOString()}`);
    console.log(`    createdAt atual: ${JSON.stringify(currentCreatedAt)}`);

    batch.update(docSnap.ref, { createdAt: realCreateTime });
    batchCount++;
    fixed++;

    // Firestore batches têm limite de 500 operações
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      console.log(`\n  Batch de ${batchCount} documentos commitado.\n`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`\n  Batch final de ${batchCount} documentos commitado.\n`);
  }

  console.log('─────────────────────────────');
  console.log(`Total de documentos: ${total}`);
  console.log(`Corrigidos:          ${fixed}`);
  console.log(`Já válidos (pulados): ${skipped}`);
  console.log('─────────────────────────────');
  console.log('Backfill concluído.');
}

backfill().catch(err => {
  console.error('Erro durante backfill:', err);
  process.exit(1);
});
