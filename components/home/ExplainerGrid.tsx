const PANELS = [
  {
    sys: "POLYMARKET",
    title: "Prediction Markets",
    description:
      "Where the money is. Real-time winner probabilities and matchup odds from Polymarket.",
    stat: "LIVE",
    live: true,
    hideOnMobile: true,
  },
  {
    sys: "OPENF1",
    title: "Qualifying Telemetry",
    description:
      "Saturday's truth. Sector splits, tyre data, and session conditions straight from FIA live timing.",
    stat: "0.001s",
    live: false,
    hideOnMobile: false,
  },
  {
    sys: "CIRCUIT_DB",
    title: "Circuit History",
    description:
      "What this track actually does. Five years of results, safety car rates, and how the grid reshuffles.",
    stat: "5 YRS",
    live: false,
    hideOnMobile: false,
  },
  {
    sys: "WEATHER",
    title: "Race Day Forecast",
    description:
      "The variable nobody prices correctly. Pinpoint forecast for the circuit, not the city.",
    stat: "72 HR",
    live: false,
    hideOnMobile: false,
  },
] as const;

export function ExplainerGrid() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-px rounded-lg border border-border/40 bg-border/40 md:mt-10 md:grid-cols-2 lg:grid-cols-4">
      {PANELS.map((panel, i) => (
        <div
          key={panel.sys}
          className={`relative overflow-hidden bg-background px-3 py-3 md:p-5 first:rounded-tl-lg last:rounded-br-lg md:first:rounded-l-lg md:first:rounded-tr-none md:last:rounded-r-lg md:last:rounded-bl-none ${panel.hideOnMobile ? "hidden md:block" : ""}`}
          style={{
            animation: `panel-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms backwards`,
          }}
        >
          {/* Red top accent line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-racing-red/60 to-racing-red/0" />

          {/* Terminal header */}
          <div className="flex items-start justify-between gap-1">
            <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 md:text-[10px]">
              <span className="text-racing-red/50">SYS</span>:{panel.sys}
            </span>
            {panel.live ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-racing-red/10 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-racing-red md:gap-1.5 md:px-2 md:text-[9px]">
                <span className="h-1 w-1 animate-pulse rounded-full bg-racing-red md:h-1.5 md:w-1.5" />
                LIVE
              </span>
            ) : (
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground/40 md:text-[10px]">
                {panel.stat}
              </span>
            )}
          </div>

          {/* Panel content */}
          <h3 className="mt-2 text-xs font-medium text-foreground md:mt-3 md:text-sm">
            {panel.title}
          </h3>
          <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground/70 md:block">
            {panel.description}
          </p>
        </div>
      ))}
    </div>
  );
}
