import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CIRCUITS, getCircuitMeta } from "@/lib/circuits";
import { fetchCircuitInfo, fetchCircuitHistory } from "@/lib/jolpica";
import { getAllBriefings } from "@/lib/kv";
import { getTeamByName } from "@/lib/teams";
import { ArchiveCard } from "@/components/ArchiveCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/SectionHeading";
import { StatCard } from "@/components/StatCard";
import type { HistoricalRaceResult, BriefingMeta } from "@/types";

// ---------------------------------------------------------------------------
// Cached data fetchers
// ---------------------------------------------------------------------------

async function getCachedCircuitHistory(circuitId: string) {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return fetchCircuitHistory(circuitId, 10);
}

async function getCachedCircuitInfo(circuitId: string) {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return fetchCircuitInfo(circuitId);
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

function computeCircuitStats(results: HistoricalRaceResult[]) {
  const winners = results.filter((r) => r.position === 1);
  const poleStarters = results.filter((r) => r.grid === 1);
  const poleWins = poleStarters.filter((r) => r.position === 1);

  // Most wins by driver at this circuit
  const driverWins = new Map<string, number>();
  for (const w of winners) {
    driverWins.set(w.driverName, (driverWins.get(w.driverName) ?? 0) + 1);
  }
  const topDriver = Array.from(driverWins.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Most wins by constructor at this circuit
  const constructorWins = new Map<string, number>();
  for (const w of winners) {
    constructorWins.set(
      w.constructorName,
      (constructorWins.get(w.constructorName) ?? 0) + 1
    );
  }
  const topConstructor = Array.from(constructorWins.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return {
    raceCount: winners.length,
    poleToWinRate:
      poleStarters.length > 0
        ? Math.round((poleWins.length / poleStarters.length) * 100)
        : null,
    topDriver: topDriver ? { name: topDriver[0], wins: topDriver[1] } : null,
    topConstructor: topConstructor
      ? { name: topConstructor[0], wins: topConstructor[1] }
      : null,
  };
}

function findRelatedBriefings(
  allBriefings: BriefingMeta[],
  grandPrixName: string
): BriefingMeta[] {
  // Match briefings by GP name (e.g., "Monaco Grand Prix" matches slug "2026-monaco-grand-prix")
  const gpSlug = grandPrixName.toLowerCase().replace(/\s+/g, "-");
  return allBriefings.filter((b) => b.slug.includes(gpSlug));
}

// ---------------------------------------------------------------------------
// Static params & metadata
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return CIRCUITS.map((c) => ({ circuitId: c.circuitId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}): Promise<Metadata> {
  const { circuitId } = await params;
  const meta = getCircuitMeta(circuitId);

  if (!meta) {
    return { title: "Circuit Not Found" };
  }

  return {
    title: `${meta.grandPrixName} Circuit Guide`,
    description: `Race history, winners, and stats for the ${meta.grandPrixName} at ${meta.locality}, ${meta.country}. Pole conversion rates, dominant teams, and related briefings.`,
    openGraph: {
      title: `${meta.grandPrixName} | Circuit Guide | Grid to Green`,
      description: `Historical race data and analysis for the ${meta.grandPrixName}.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CircuitPage({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}) {
  const { circuitId } = await params;
  const meta = getCircuitMeta(circuitId);

  if (!meta) {
    notFound();
  }

  const [circuitInfo, history, allBriefings] = await Promise.all([
    getCachedCircuitInfo(circuitId).catch(() => null),
    getCachedCircuitHistory(circuitId).catch(() => []),
    getCachedBriefings(),
  ]);

  const winners = history.filter((r) => r.position === 1);
  const stats = computeCircuitStats(history);
  const relatedBriefings = findRelatedBriefings(
    allBriefings,
    meta.grandPrixName
  );

  const tcTeam = stats.topConstructor
    ? getTeamByName(stats.topConstructor.name)
    : undefined;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Circuits", href: "/circuits" },
    { label: meta.grandPrixName, href: `/circuits/${meta.circuitId}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: circuitInfo?.circuitName ?? meta.grandPrixName,
            description: `Formula 1 circuit for the ${meta.grandPrixName}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: meta.locality,
              addressCountry: meta.country,
            },
            ...(circuitInfo && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: circuitInfo.lat,
                longitude: circuitInfo.lng,
              },
            }),
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
            {meta.locality}, {meta.country}
          </span>
        </div>
        <h1 className="mt-2 font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          {meta.grandPrixName.replace(" Grand Prix", "").toUpperCase()}
          <span className="text-muted-foreground/30"> GP</span>
        </h1>
        {circuitInfo && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/60">
            {circuitInfo.circuitName}
          </p>
        )}
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Stats grid */}
      {stats.raceCount > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              value={`${stats.raceCount}`}
              label={`Race${stats.raceCount === 1 ? "" : "s"} (last 10 yrs)`}
            />
            {stats.poleToWinRate !== null && (
              <StatCard
                value={`${stats.poleToWinRate}%`}
                label="Pole to win rate"
              />
            )}
            {stats.topDriver && (
              <StatCard
                value={stats.topDriver.name.split(" ").pop() ?? stats.topDriver.name}
                label={`Most wins (${stats.topDriver.wins})`}
              />
            )}
            {stats.topConstructor && (
              tcTeam ? (
                <Link href={`/teams/${tcTeam.teamId}`}>
                  <StatCard
                    value={stats.topConstructor.name}
                    label={`Top team (${stats.topConstructor.wins} win${stats.topConstructor.wins === 1 ? "" : "s"})`}
                  />
                </Link>
              ) : (
                <StatCard
                  value={stats.topConstructor.name}
                  label={`Top team (${stats.topConstructor.wins} win${stats.topConstructor.wins === 1 ? "" : "s"})`}
                />
              )
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Winners table */}
            {winners.length > 0 && (
              <section>
                <SectionHeading title="RACE WINNERS" annotation="HISTORY" />
                <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Year</th>
                        <th className="px-4 py-3 font-medium">Winner</th>
                        <th className="px-4 py-3 font-medium">Team</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Grid
                        </th>
                        <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">
                          Laps
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((w) => {
                        const wTeam = getTeamByName(w.constructorName);
                        return (
                        <tr
                          key={w.season}
                          className="border-b border-border/20 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {w.season}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-muted-foreground/60">
                              {w.driverCode}
                            </span>{" "}
                            <span className="text-foreground">
                              {w.driverName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {wTeam ? (
                              <Link href={`/teams/${wTeam.teamId}`} className="text-muted-foreground transition-colors hover:text-foreground">
                                {w.constructorName}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{w.constructorName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            <span
                              className={
                                w.grid === 1
                                  ? "text-terminal-green"
                                  : "text-muted-foreground"
                              }
                            >
                              P{w.grid}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted-foreground sm:table-cell">
                            {w.laps}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Full results by year */}
            {winners.length > 0 && (
              <section>
                <SectionHeading
                  title="PODIUM RESULTS"
                  annotation="TOP_3_BY_YEAR"
                />
                <div className="space-y-4">
                  {winners.map((w) => {
                    const yearResults = history.filter(
                      (r) => r.season === w.season && r.position <= 3
                    );
                    return (
                      <div
                        key={w.season}
                        className="rounded-lg border border-border/40 bg-card p-4"
                      >
                        <div className="mb-3 flex items-baseline gap-2">
                          <span className="font-heading text-xl text-foreground">
                            {w.season}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/50">
                            {w.raceName}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {yearResults.map((r) => (
                            <div
                              key={r.position}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="flex items-center gap-3">
                                <span
                                  className={`w-5 text-right font-mono text-xs ${
                                    r.position === 1
                                      ? "text-terminal-amber"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  P{r.position}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground/60">
                                  {r.driverCode}
                                </span>
                                <span className="text-foreground">
                                  {r.driverName}
                                </span>
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {r.time ??
                                  (r.status === "Finished" ? "" : r.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Circuit info card */}
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Circuit Info
              </span>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-foreground">
                    {meta.locality}, {meta.country}
                  </dd>
                </div>
                {circuitInfo && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Circuit</dt>
                    <dd className="text-foreground">
                      {circuitInfo.circuitName}
                    </dd>
                  </div>
                )}
                {stats.poleToWinRate !== null && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Pole conversion</dt>
                    <dd className="font-mono text-terminal-green">
                      {stats.poleToWinRate}%
                    </dd>
                  </div>
                )}
                {stats.topDriver && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Most wins</dt>
                    <dd className="text-foreground">
                      {stats.topDriver.name} ({stats.topDriver.wins})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* All circuits link */}
            <Link
              href="/circuits"
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground transition-colors hover:border-racing-red/40 hover:text-foreground"
            >
              <span className="text-racing-red">&larr;</span>
              All circuits
            </Link>
          </aside>
        </div>
      </div>

      {/* Related briefings */}
      {relatedBriefings.length > 0 && (
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <SectionHeading title="BRIEFINGS" annotation={meta.grandPrixName.replace(" Grand Prix", "").toUpperCase()} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedBriefings.map((b) => (
                <ArchiveCard key={b.slug} meta={b} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}