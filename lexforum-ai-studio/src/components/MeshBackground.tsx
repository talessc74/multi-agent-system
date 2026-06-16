// Fixed animated gradient backdrop for the Liquid Glass material — without
// it, .glass/.glass-static surfaces have nothing colorful behind them to
// show through (see Milestone 2, .xdrs/_local/adrs/application/plans/001-liquid-glass-rollout.md).
export function MeshBackground() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="mesh-blob b1" />
      <div className="mesh-blob b2" />
      <div className="mesh-blob b3" />
    </div>
  );
}
