export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">OCAPX AI Desk</div>
      <div className="flex-1 px-2 py-2">
        {/* DataValidationPanel removed - now only on Admin Dashboard */}
      </div>
    </aside>
  );
}
