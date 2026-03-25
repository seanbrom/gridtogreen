"use client";

export interface TickerItem {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

interface DataTickerProps {
  items: TickerItem[];
}

function TrendIndicator({ trend }: { trend?: TickerItem["trend"] }) {
  if (!trend || trend === "neutral") return null;
  return (
    <span
      className={
        trend === "up" ? "text-terminal-green" : "text-racing-red"
      }
    >
      {trend === "up" ? "\u25B2" : "\u25BC"}
    </span>
  );
}

function TickerContent({ items }: { items: TickerItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <span key={i} className="inline-flex shrink-0 items-center gap-2 px-6">
          <span className="text-muted-foreground/60 uppercase">{item.label}</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {item.value}
          </span>
          <TrendIndicator trend={item.trend} />
          <span className="ml-4 text-border/40">{"\u2502"}</span>
        </span>
      ))}
    </>
  );
}

export function DataTicker({ items }: DataTickerProps) {
  if (items.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden border-b border-border/30 bg-card/50">
      <div className="ticker-track text-[10px] md:text-xs py-2">
        <TickerContent items={items} />
        <TickerContent items={items} />
      </div>
    </div>
  );
}
