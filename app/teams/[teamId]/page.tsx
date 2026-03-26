import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { TEAMS_META, getTeamMeta } from "@/lib/teams";
import { DRIVERS } from "@/lib/drivers";
import {
  fetchConstructorStandings,
  fetchConstructorSeasonResults,
  type ConstructorSeasonResult,
} from "@/lib/jolpica";
import { getCircuitMeta } from "@/lib/circuits";
import { StatCard } from "@/components/StatCard";
import { SectionHeading } from "@/components/SectionHeading";
import { PointsBar } from "@/components/PointsBar";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { isFinished, positionColor } from "@/lib/race-utils";

// ---------------------------------------------------------------------------
// Cached data fetchers
// ---------------------------------------------------------------------------

async function getCachedConstructorStandings() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchConstructorStandings().catch(() => []);
}

async function getCachedConstructorResults(constructorId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchConstructorSeasonResults(constructorId).catch(() => []);
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function computeTeamStats(results: ConstructorSeasonResult[]) {
  let totalPoints = 0;
  let wins = 0;
  let podiums = 0;
  let doublePodiums = 0;
  let doublePoints = 0;

  for (const race of results) {
    let racePoints = 0;
    let racePodiums = 0;
    let racePointsFinishes = 0;

    for (const r of race.results) {
      racePoints += r.points;
      if (r.position === 1) wins++;
      if (r.position <= 3) {
        podiums++;
        racePodiums++;
      }
      if (r.points > 0) racePointsFinishes++;
    }

    totalPoints += racePoints;
    if (racePodiums >= 2) doublePodiums++;
    if (racePointsFinishes >= 2) doublePoints++;
  }

  return { races: results.length, totalPoints, wins, podiums, doublePodiums, doublePoints };
}

function computeDriverSplits(results: ConstructorSeasonResult[]) {
  const splits = new Map<string, { code: string; name: string; points: number; bestFinish: number; races: number }>();

  for (const race of results) {
    for (const r of race.results) {
      const existing = splits.get(r.driverId) ?? {
        code: r.driverCode,
        name: r.driverName,
        points: 0,
        bestFinish: 99,
        races: 0,
      };
      existing.points += r.points;
      existing.races++;
      if (r.position < existing.bestFinish) existing.bestFinish = r.position;
      splits.set(r.driverId, existing);
    }
  }

  return Array.from(splits.entries())
    .map(([driverId, data]) => ({ driverId, ...data }))
    .sort((a, b) => b.points - a.points);
}

// ---------------------------------------------------------------------------
// Static params & metadata
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [{ teamId: TEAMS_META[0].teamId }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const meta = getTeamMeta(teamId);

  if (!meta) {
    return { title: "Team Not Found" };
  }

  return {
    title: `${meta.name} | F1 Team Profile`,
    description: `${meta.fullName} 2026 season stats, constructor championship standing, driver lineup, and race results. Based in ${meta.base}, ${meta.country}.`,
    openGraph: {
      title: `${meta.name} | Team Profile | Grid to Green`,
      description: `Season stats and race results for ${meta.fullName}.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const meta = getTeamMeta(teamId);

  if (!meta) {
    notFound();
  }

  const [standings, seasonResults] = await Promise.all([
    getCachedConstructorStandings(),
    getCachedConstructorResults(teamId),
  ]);

  const standing = standings.find((s) => s.constructorId === teamId) ?? null;
  const stats = computeTeamStats(seasonResults);
  const driverSplits = computeDriverSplits(seasonResults);
  const teamDrivers = DRIVERS.filter((d) => d.teamId === teamId);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Teams", href: "/teams" },
    { label: meta.name, href: `/teams/${meta.teamId}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: meta.fullName,
            sport: "Formula 1",
            location: {
              "@type": "Place",
              name: meta.base,
              address: { "@type": "PostalAddress", addressCountry: meta.country },
            },
            member: teamDrivers.map((d) => ({
              "@type": "Person",
              name: `${d.firstName} ${d.lastName}`,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)),
        }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {meta.base}, {meta.country}
          </span>
        </div>
        <h1 className="mt-2 font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          {meta.name.toUpperCase()}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground/60">
          {meta.fullName}
        </p>
        {standing && (
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-heading text-2xl text-racing-red">P{standing.position}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {standing.points} pts &middot; {standing.wins} win{standing.wins === 1 ? "" : "s"}
            </span>
          </div>
        )}
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Stats grid */}
      {stats.races > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <StatCard value={`${stats.wins}`} label="Wins" />
            <StatCard value={`${stats.podiums}`} label="Podiums" />
            <StatCard value={`${stats.totalPoints}`} label="Points" />
            <StatCard value={`${stats.doublePodiums}`} label="Double podiums" />
            <StatCard value={`${stats.doublePoints}`} label="Double points" />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Season results table */}
            {seasonResults.length > 0 && (
              <section>
                <SectionHeading title="RACE RESULTS" annotation="2026_SEASON" />
                <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Race</th>
                        {teamDrivers.map((d) => (
                          <th key={d.code} className="px-4 py-3 text-center font-medium">
                            <Link href={`/drivers/${d.driverId}`} className="transition-colors hover:text-racing-red">
                              {d.code}
                            </Link>
                          </th>
                        ))}
                        <th className="px-4 py-3 font-medium text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonResults.map((race) => {
                        const circuitMeta = getCircuitMeta(race.circuitId);
                        const racePoints = race.results.reduce((s, r) => s + r.points, 0);

                        return (
                          <tr key={race.round} className="border-b border-border/20 transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-right font-mono text-xs text-muted-foreground/50">
                                  R{race.round}
                                </span>
                                {circuitMeta ? (
                                  <Link href={`/circuits/${circuitMeta.circuitId}`} className="text-foreground transition-colors hover:text-racing-red">
                                    {circuitMeta.grandPrixName.replace(" Grand Prix", "")}
                                  </Link>
                                ) : (
                                  <span className="text-foreground">{race.raceName.replace(" Grand Prix", "")}</span>
                                )}
                              </div>
                            </td>
                            {teamDrivers.map((d) => {
                              const result = race.results.find((r) => r.driverId === d.driverId);
                              if (!result) {
                                return (
                                  <td key={d.code} className="px-4 py-3 text-center font-mono text-xs text-muted-foreground/30">
                                    &mdash;
                                  </td>
                                );
                              }
                              const finished = isFinished(result.status);
                              return (
                                <td key={d.code} className="px-4 py-3 text-center font-mono text-xs">
                                  <span className={positionColor(result.position, finished)}>
                                    {finished ? `P${result.position}` : "DNF"}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              <span className={racePoints > 0 ? "font-medium text-foreground" : "text-muted-foreground/40"}>
                                {racePoints > 0 ? racePoints : 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                          Season total
                        </td>
                        {teamDrivers.map((d) => {
                          const split = driverSplits.find((s) => s.driverId === d.driverId);
                          return (
                            <td key={d.code} className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                              {split ? `${split.points} pts` : ""}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right font-mono text-xs font-medium text-foreground">
                          {stats.totalPoints}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}

            {/* No results yet */}
            {seasonResults.length === 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/50">
                  SYS:STANDBY // AWAITING RACE DATA
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Season results will appear here once races begin.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Team info card */}
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Team Info
              </span>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Base</dt>
                  <dd className="text-foreground">{meta.base}, {meta.country}</dd>
                </div>
                {standing && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Championship</dt>
                      <dd className="font-mono text-terminal-green">P{standing.position}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Points</dt>
                      <dd className="font-mono text-foreground">{standing.points}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Wins</dt>
                      <dd className="font-mono text-foreground">{standing.wins}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Driver lineup */}
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Driver Lineup
              </span>
              <div className="space-y-4">
                {teamDrivers.map((d) => {
                  const split = driverSplits.find((s) => s.driverId === d.driverId);
                  return (
                    <Link
                      key={d.driverId}
                      href={`/drivers/${d.driverId}`}
                      className="group flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm text-foreground transition-colors group-hover:text-racing-red">
                          {d.firstName} {d.lastName}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {d.code} &middot; #{d.number}
                        </div>
                      </div>
                      {split && (
                        <div className="text-right">
                          <div className="font-mono text-sm text-foreground">
                            {split.points} pts
                          </div>
                          <div className="font-mono text-xs text-muted-foreground/60">
                            Best: P{split.bestFinish}
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Points split bar */}
              {driverSplits.length === 2 && (driverSplits[0].points + driverSplits[1].points) > 0 && (
                <div className="mt-4 border-t border-border/30 pt-4">
                  <PointsBar
                    driver1={driverSplits[0].code}
                    driver2={driverSplits[1].code}
                    points1={driverSplits[0].points}
                    points2={driverSplits[1].points}
                  />
                </div>
              )}
            </div>

            {/* All teams link */}
            <Link
              href="/teams"
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground transition-colors hover:border-racing-red/40 hover:text-foreground"
            >
              <span className="text-racing-red">&larr;</span>
              All teams
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
