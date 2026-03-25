import Link from "next/link";
import type { DriverOdds } from "@/types";
import { getDriverByCode } from "@/lib/drivers";

interface OddsWidgetProps {
  raceWinner: DriverOdds[];
}

export function OddsWidget({ raceWinner }: OddsWidgetProps) {
  if (raceWinner.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Prediction Market Odds
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          No prediction market data available for this race.
        </p>
      </div>
    );
  }

  const maxProb = raceWinner[0]?.impliedProbability ?? 1;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Prediction Market Odds
        </span>
        <span className="text-xs text-muted-foreground">Polymarket</span>
      </div>
      <div className="space-y-3">
        {raceWinner.slice(0, 10).map((driver, i) => {
          const pct = Math.round(driver.impliedProbability * 100);
          const barWidth = (driver.impliedProbability / maxProb) * 100;
          const driverMeta = getDriverByCode(driver.driverCode);

          return (
            <div key={driver.driverName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  {driverMeta ? (
                    <Link
                      href={`/drivers/${driverMeta.driverId}`}
                      className="flex items-center gap-2 transition-colors hover:text-racing-red"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {driver.driverCode}
                      </span>
                      <span className="text-foreground">
                        {driver.driverName}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <span className="font-mono text-xs text-muted-foreground">
                        {driver.driverCode}
                      </span>
                      <span className="text-foreground">
                        {driver.driverName}
                      </span>
                    </>
                  )}
                </span>
                <span className="font-mono text-sm font-medium text-foreground">
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-racing-red to-racing-red/60 transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
