import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { DRIVERS, getDriverMeta } from "@/lib/drivers";
import {
  fetchDriverStandings,
  fetchDriverSeasonResults,
  type DriverSeasonResult,
} from "@/lib/jolpica";
import { getAllBriefings } from "@/lib/kv";
import { getCircuitMeta } from "@/lib/circuits";
import { isFinished, positionColor } from "@/lib/race-utils";
import { ArchiveCard } from "@/components/ArchiveCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { PointsBar } from "@/components/PointsBar";
import { SectionHeading } from "@/components/SectionHeading";
import { StatCard } from "@/components/StatCard";
import type { BriefingMeta } from "@/types";

// ---------------------------------------------------------------------------
// Cached data fetchers
// ---------------------------------------------------------------------------

async function getCachedStandings() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchDriverStandings().catch(() => []);
}

async function getCachedSeasonResults(driverId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchDriverSeasonResults(driverId).catch(() => []);
}

async function getCachedBriefings() {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return getAllBriefings();
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function computeDriverStats(results: DriverSeasonResult[]) {
  const wins = results.filter((r) => r.position === 1).length;
  const podiums = results.filter((r) => r.position <= 3).length;
  const pointsFinishes = results.filter((r) => r.points > 0).length;
  const dnfs = results.filter((r) => !isFinished(r.status)).length;
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);

  const gridPositions = results.map((r) => r.grid).filter((g) => g > 0);
  const avgGrid =
    gridPositions.length > 0
      ? gridPositions.reduce((s, g) => s + g, 0) / gridPositions.length
      : null;

  const racePositions = results
    .filter((r) => isFinished(r.status))
    .map((r) => r.position);
  const avgFinish =
    racePositions.length > 0
      ? racePositions.reduce((s, p) => s + p, 0) / racePositions.length
      : null;

  const positionsGained = results
    .filter((r) => r.grid > 0 && isFinished(r.status))
    .reduce((sum, r) => sum + (r.grid - r.position), 0);

  return {
    races: results.length,
    wins,
    podiums,
    pointsFinishes,
    dnfs,
    totalPoints,
    avgGrid,
    avgFinish,
    positionsGained,
  };
}

function findRelatedBriefings(
  allBriefings: BriefingMeta[],
  driverCode: string
): BriefingMeta[] {
  // Briefing headlines/summaries often mention driver codes or names
  const code = driverCode.toUpperCase();
  return allBriefings.filter(
    (b) =>
      b.headline.toUpperCase().includes(code) ||
      b.summary.toUpperCase().includes(code)
  );
}

// ---------------------------------------------------------------------------
// Static params & metadata
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [{ driverId: DRIVERS[0].driverId }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ driverId: string }>;
}): Promise<Metadata> {
  const { driverId } = await params;
  const meta = getDriverMeta(driverId);

  if (!meta) {
    return { title: "Driver Not Found" };
  }

  const fullName = `${meta.firstName} ${meta.lastName}`;

  return {
    title: `${fullName} | ${meta.team}`,
    description: `${fullName} 2026 F1 season stats, race results, qualifying performance, and championship standing. Driving for ${meta.team}.`,
    openGraph: {
      title: `${fullName} | Driver Profile | Grid to Green`,
      description: `Season stats and race results for ${fullName} at ${meta.team}.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DriverPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;
  const meta = getDriverMeta(driverId);

  if (!meta) {
    notFound();
  }

  const [standings, seasonResults, allBriefings] = await Promise.all([
    getCachedStandings(),
    getCachedSeasonResults(driverId),
    getCachedBriefings(),
  ]);

  const standing = standings.find((s) => s.driverId === driverId) ?? null;
  const stats = computeDriverStats(seasonResults);
  const relatedBriefings = findRelatedBriefings(allBriefings, meta.code);

  // Find teammate
  const teammate = DRIVERS.find(
    (d) => d.team === meta.team && d.driverId !== meta.driverId
  );
  const teammateStanding = teammate
    ? standings.find((s) => s.driverId === teammate.driverId) ?? null
    : null;

  const fullName = `${meta.firstName} ${meta.lastName}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: fullName,
            jobTitle: "Formula 1 Driver",
            worksFor: {
              "@type": "SportsTeam",
              name: meta.team,
            },
            nationality: meta.nationality,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Home" },
              { label: "Drivers", href: "/drivers" },
              { label: fullName, href: `/drivers/${meta.driverId}` },
            ])
          ),
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Drivers", href: "/drivers" },
          { label: fullName },
        ]}
      />

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            #{meta.number} &middot;{" "}
            <Link href={`/teams/${meta.teamId}`} className="transition-colors hover:text-foreground">
              {meta.team}
            </Link>
            {" "}&middot; {meta.nationality}
          </span>
        </div>
        <h1 className="mt-2 font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          <span className="text-muted-foreground/30">{meta.firstName.toUpperCase()} </span>
          {meta.lastName.toUpperCase()}
        </h1>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-mono text-2xl text-racing-red">{meta.code}</span>
          {standing && (
            <span className="font-mono text-sm text-muted-foreground">
              P{standing.position} in championship &middot; {standing.points} pts
            </span>
          )}
        </div>
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Stats grid */}
      {stats.races > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <StatCard value={`${stats.wins}`} label="Wins" />
            <StatCard value={`${stats.podiums}`} label="Podiums" />
            <StatCard value={`${stats.totalPoints}`} label="Points" />
            <StatCard
              value={stats.avgGrid ? stats.avgGrid.toFixed(1) : "N/A"}
              label="Avg grid"
            />
            <StatCard
              value={stats.avgFinish ? stats.avgFinish.toFixed(1) : "N/A"}
              label="Avg finish"
            />
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
                        <th className="px-4 py-3 font-medium text-right">
                          Grid
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Finish
                        </th>
                        <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">
                          +/-
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonResults.map((r) => {
                        const circuitMeta = getCircuitMeta(r.circuitId);
                        const gained = r.grid > 0 ? r.grid - r.position : 0;
                        const finished = isFinished(r.status);

                        return (
                          <tr
                            key={r.round}
                            className="border-b border-border/20 transition-colors hover:bg-muted/30"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-right font-mono text-xs text-muted-foreground/50">
                                  R{r.round}
                                </span>
                                {circuitMeta ? (
                                  <Link
                                    href={`/circuits/${circuitMeta.circuitId}`}
                                    className="text-foreground transition-colors hover:text-racing-red"
                                  >
                                    {circuitMeta.grandPrixName.replace(
                                      " Grand Prix",
                                      ""
                                    )}
                                  </Link>
                                ) : (
                                  <span className="text-foreground">
                                    {r.raceName.replace(" Grand Prix", "")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                              P{r.grid}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              <span
                                className={positionColor(r.position, finished)}
                              >
                                {finished ? `P${r.position}` : "DNF"}
                              </span>
                            </td>
                            <td className="hidden px-4 py-3 text-right font-mono text-xs sm:table-cell">
                              {finished && r.grid > 0 ? (
                                <span
                                  className={
                                    gained > 0
                                      ? "text-terminal-green"
                                      : gained < 0
                                        ? "text-racing-red"
                                        : "text-muted-foreground"
                                  }
                                >
                                  {gained > 0 ? `+${gained}` : gained === 0 ? "=" : `${gained}`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">
                                  &mdash;
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              <span
                                className={
                                  r.points > 0
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground/40"
                                }
                              >
                                {r.points > 0 ? r.points : 0}
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
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {stats.avgGrid
                            ? `avg ${stats.avgGrid.toFixed(1)}`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {stats.avgFinish
                            ? `avg ${stats.avgFinish.toFixed(1)}`
                            : ""}
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono text-xs sm:table-cell">
                          <span
                            className={
                              stats.positionsGained > 0
                                ? "text-terminal-green"
                                : stats.positionsGained < 0
                                  ? "text-racing-red"
                                  : "text-muted-foreground"
                            }
                          >
                            {stats.positionsGained > 0
                              ? `+${stats.positionsGained}`
                              : stats.positionsGained}
                          </span>
                        </td>
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
            {/* Driver card */}
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Driver Info
              </span>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Team</dt>
                  <dd>
                    <Link href={`/teams/${meta.teamId}`} className="text-foreground transition-colors hover:text-racing-red">
                      {meta.team}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Number</dt>
                  <dd className="font-mono text-foreground">#{meta.number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Nationality</dt>
                  <dd className="text-foreground">{meta.nationality}</dd>
                </div>
                {standing && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Championship</dt>
                      <dd className="font-mono text-terminal-green">
                        P{standing.position}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Points</dt>
                      <dd className="font-mono text-foreground">
                        {standing.points}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Wins</dt>
                      <dd className="font-mono text-foreground">
                        {standing.wins}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Teammate comparison */}
            {teammate && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Teammate
                </span>
                <Link
                  href={`/drivers/${teammate.driverId}`}
                  className="group flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm text-foreground transition-colors group-hover:text-racing-red">
                      {teammate.firstName} {teammate.lastName}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {teammate.code} &middot; #{teammate.number}
                    </div>
                  </div>
                  {teammateStanding && standing && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-muted-foreground">
                        P{teammateStanding.position}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground/60">
                        {teammateStanding.points} pts
                      </div>
                    </div>
                  )}
                </Link>
                {standing && teammateStanding && (
                  <div className="mt-3 border-t border-border/30 pt-3">
                    <PointsBar
                      driver1={meta.code}
                      driver2={teammate.code}
                      points1={standing.points}
                      points2={teammateStanding.points}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Season summary */}
            {stats.races > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Season Summary
                </span>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Races</dt>
                    <dd className="font-mono text-foreground">{stats.races}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Points finishes</dt>
                    <dd className="font-mono text-foreground">
                      {stats.pointsFinishes}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">DNFs</dt>
                    <dd
                      className={`font-mono ${stats.dnfs > 0 ? "text-racing-red" : "text-foreground"}`}
                    >
                      {stats.dnfs}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Positions gained</dt>
                    <dd
                      className={`font-mono ${
                        stats.positionsGained > 0
                          ? "text-terminal-green"
                          : stats.positionsGained < 0
                            ? "text-racing-red"
                            : "text-foreground"
                      }`}
                    >
                      {stats.positionsGained > 0
                        ? `+${stats.positionsGained}`
                        : stats.positionsGained}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* All drivers link */}
            <Link
              href="/drivers"
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground transition-colors hover:border-racing-red/40 hover:text-foreground"
            >
              <span className="text-racing-red">&larr;</span>
              All drivers
            </Link>
          </aside>
        </div>
      </div>

      {/* Related briefings */}
      {relatedBriefings.length > 0 && (
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <SectionHeading
              title="BRIEFINGS"
              annotation={meta.code}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedBriefings.slice(0, 6).map((b) => (
                <ArchiveCard key={b.slug} meta={b} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

