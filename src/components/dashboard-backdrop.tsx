/** Decorative brand layer shared by both private workspaces. */
export function DashboardBackdrop() {
  return <div className="dashboard-backdrop" aria-hidden="true">
    <div className="dashboard-brand-mark">
      <img src="/favicon.svg" alt="" />
      <span translate="no">LUMEN BANK</span>
    </div>
    <div className="dashboard-etching" />
  </div>;
}