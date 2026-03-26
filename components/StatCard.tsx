export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="font-heading text-3xl text-racing-red">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </div>
    </div>
  );
}
