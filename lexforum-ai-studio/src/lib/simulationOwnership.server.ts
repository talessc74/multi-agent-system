/**
 * Server-only, pure — no Firestore/Express here so it can be unit tested
 * directly. Anonymous simulations are saved with userId: null (see
 * dbService.saveSimulation); the first authenticated user to try to check
 * out for one becomes its owner, since nobody owned it before.
 */
export type OwnershipDecision = 'forbidden' | 'claim' | 'ok';

export function resolveSimulationOwnership(ownerId: string | null, uid: string): OwnershipDecision {
  if (ownerId === null) return 'claim';
  if (ownerId === uid) return 'ok';
  return 'forbidden';
}
