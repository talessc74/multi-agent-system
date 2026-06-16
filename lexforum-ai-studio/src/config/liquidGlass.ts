// Milestone 2 (.xdrs/_local/adrs/application/plans/001-liquid-glass-rollout.md).
// Off by default — production behavior/look is unchanged unless explicitly set.
export const LIQUID_GLASS_ENABLED = import.meta.env.VITE_LIQUID_GLASS === 'true';
