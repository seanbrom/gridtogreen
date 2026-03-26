import Link from "next/link";
import { getDriverByCode } from "@/lib/drivers";

interface QualifyingResult {
  position: number;
  driverCode: string;
  driverName: string;
  fastestLapTime: string;
  gapToPoleSecs: number;
}

interface QualifyingGridProps {
  results: QualifyingResult[];
}

export function QualifyingGrid({ results }: QualifyingGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Qualifying Grid
      </span>
      <div className="space-y-2">
        {results.slice(0, 10).map((q) => {
          const qDriver = getDriverByCode(q.driverCode);
          return (
            <div
              key={q.driverCode}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-3">
                <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                  P{q.position}
                </span>
                {qDriver ? (
                  <Link
                    href={`/drivers/${qDriver.driverId}`}
                    className="flex items-center gap-3 transition-colors hover:text-racing-red"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {q.driverCode}
                    </span>
                    <span className="text-foreground">{q.driverName}</span>
                  </Link>
                ) : (
                  <>
                    <span className="font-mono text-xs text-muted-foreground">
                      {q.driverCode}
                    </span>
                    <span className="text-foreground">{q.driverName}</span>
                  </>
                )}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {q.position === 1
                  ? q.fastestLapTime
                  : `+${q.gapToPoleSecs.toFixed(3)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
