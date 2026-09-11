import { describe, it, expect } from 'vitest';
import { resolveSimulationOwnership } from '../lib/simulationOwnership.server';

describe('resolveSimulationOwnership', () => {
  it('claims an anonymous simulation (userId: null) for the requesting user', () => {
    expect(resolveSimulationOwnership(null, 'uid-123')).toBe('claim');
  });

  it('allows checkout when the requester already owns the simulation', () => {
    expect(resolveSimulationOwnership('uid-123', 'uid-123')).toBe('ok');
  });

  it('forbids checkout when the simulation belongs to a different user', () => {
    expect(resolveSimulationOwnership('uid-owner', 'uid-attacker')).toBe('forbidden');
  });
});
