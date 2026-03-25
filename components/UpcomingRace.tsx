import type { UpcomingRaceData } from "@/lib/upcoming-race";
import { OddsWidget } from "@/components/briefing/OddsWidget";
import { RaceCountdown } from "@/components/RaceCountdown";

interface UpcomingRaceProps {
  data: UpcomingRaceData;
}

export function UpcomingRace({ data }: UpcomingRaceProps) {
  const { meeting, circuit, recentWinners, driverStandings, constructorStandings, odds, weather } = data;

  const raceDate = new Date(meeting.date_start);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-racing-red/10 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 md:pt-16">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-racing-red/10 px-3 py-1 text-xs font-medium text-racing-red">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-racing-red animate-pulse" />
              UP NEXT
            </span>
            <span>{circuit?.circuitName ?? meeting.circuit_short_name}</span>
            <span className="text-border">|</span>
            <span>
              {circuit?.locality ?? meeting.location},{" "}
              {circuit?.country ?? meeting.country_name}
            </span>
          </div>

          <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground md:text-6xl lg:text-7xl">
            {meeting.meeting_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Full briefing publishes after qualifying. Here&apos;s what the
            data says heading into the weekend.
          </p>
        </div>
      </section>

      <RaceCountdown raceDate={meeting.date_start} />

      {/* Content grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Championship standings */}
            {driverStandings.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-4 w-1 rounded-full bg-racing-red" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Championship Standings
                  </span>
                </div>
                <div className="space-y-2">
                  {driverStandings.slice(0, 10).map((d) => (
                    <div
                      key={d.driverId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                          {d.position}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {d.code}
                        </span>
                        <span className="text-foreground">
                          {d.givenName} {d.familyName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.constructorName}
                        </span>
                      </span>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {d.points}
                        <span className="ml-0.5 text-xs text-muted-foreground">
                          pts
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constructor standings */}
            {constructorStandings.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-4 w-1 rounded-full bg-racing-red" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Constructor Standings
                  </span>
                </div>
                <div className="space-y-2">
                  {constructorStandings.slice(0, 10).map((c) => (
                    <div
                      key={c.constructorId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                          {c.position}
                        </span>
                        <span className="text-foreground">
                          {c.constructorName}
                        </span>
                      </span>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {c.points}
                        <span className="ml-0.5 text-xs text-muted-foreground">
                          pts
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Circuit history */}
            {recentWinners.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-4 w-1 rounded-full bg-racing-red" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Recent Winners Here
                  </span>
                </div>
                <div className="space-y-2">
                  {recentWinners.map((w) => (
                    <div
                      key={w.season}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {w.season}
                        </span>
                        <span className="text-foreground">{w.driverName}</span>
                        <span className="text-xs text-muted-foreground">
                          {w.constructorName}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        Started P{w.grid}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <OddsWidget raceWinner={odds.raceWinner} />

            {/* H2H Markets */}
            {odds.headToHeads.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Head-to-Head Markets
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Polymarket
                  </span>
                </div>
                <div className="space-y-4">
                  {odds.headToHeads.map((h2h) => {
                    const pct1 = Math.round(h2h.driver1Probability * 100);
                    const pct2 = 100 - pct1;
                    return (
                      <div key={h2h.question} className="space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {h2h.question}
                        </p>
                        <div className="flex h-6 w-full overflow-hidden rounded-md text-xs font-medium">
                          <div
                            className="flex items-center justify-center bg-racing-red text-white"
                            style={{ width: `${pct1}%` }}
                          >
                            {pct1 > 15 && `${h2h.driver1} ${pct1}%`}
                          </div>
                          <div
                            className="flex items-center justify-center bg-secondary text-muted-foreground"
                            style={{ width: `${pct2}%` }}
                          >
                            {pct2 > 15 && `${h2h.driver2} ${pct2}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weather */}
            {weather && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Race Day Weather
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {weather.conditionSummary}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="block font-heading text-2xl text-foreground">
                      {Math.round(weather.maxTempC)}°
                    </span>
                    <span className="text-xs text-muted-foreground">Temp</span>
                  </div>
                  <div>
                    <span className="block font-heading text-2xl text-foreground">
                      {weather.precipitationProbability}%
                    </span>
                    <span className="text-xs text-muted-foreground">Rain</span>
                  </div>
                  <div>
                    <span className="block font-heading text-2xl text-foreground">
                      {Math.round(weather.windSpeedKmh)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      km/h wind
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Briefing status */}
            <div className="rounded-lg border border-border/60 bg-card p-6 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-racing-red animate-pulse" />
                Full briefing drops after qualifying
              </span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
