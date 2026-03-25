export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base tracking-wide text-foreground">
            GRID TO GREEN
          </span>
          <span className="h-3 w-0.5 bg-racing-red" />
          <span>Pre-race briefings for every Grand Prix</span>
        </div>
        <div className="flex flex-col items-center gap-1 md:items-end">
          <p>
            Data from OpenF1, Jolpica, Polymarket &amp; Open-Meteo
          </p>
          <p>
            Powered by{" "}
            <span className="text-foreground font-medium">Claude</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
