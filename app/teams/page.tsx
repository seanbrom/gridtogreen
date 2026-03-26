import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { TEAMS_META } from "@/lib/teams";
import { DRIVERS } from "@/lib/drivers";
import { fetchConstructorStandings } from "@/lib/jolpica";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "F1 Teams",
  description:
    "Every constructor on the 2026 Formula 1 grid. Championship standings, driver lineups, points, wins, and season stats for all 11 teams.",
  openGraph: {
    title: "F1 Teams | Grid to Green",
    description:
      "Constructor standings and team profiles for the 2026 F1 season.",
  },
};

async function getCachedStandings() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchConstructorStandings().catch(() => []);
}

export default async function TeamsPage() {
  const standings = await getCachedStandings();
  const standingsMap = new Map(standings.map((s) => [s.constructorId, s]));

  // Sort teams by championship position, unranked at the end
  const sortedTeams = [...TEAMS_META].sort((a, b) => {
    const posA = standingsMap.get(a.teamId)?.position ?? 999;
    const posB = standingsMap.get(b.teamId)?.position ?? 999;
    return posA - posB;
  });

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Teams", href: "/teams" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)),
        }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-10">
        <h1 className="font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          F1 <span className="text-terminal-green">TEAMS</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          All 11 constructors competing in the 2026 Formula 1 World Championship.
          Select a team to see their season results and driver lineup.
        </p>
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Teams grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTeams.map((team) => {
            const s = standingsMap.get(team.teamId);
            const teamDrivers = DRIVERS.filter((d) => d.teamId === team.teamId);

            return (
              <Link
                key={team.teamId}
                href={`/teams/${team.teamId}`}
                className="group relative block overflow-hidden rounded-lg border border-border/60 bg-card p-5 transition-all hover:border-racing-red/40 hover:shadow-[0_0_24px_rgba(232,0,45,0.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-racing-red via-racing-red/60 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      {team.base}, {team.country}
                    </div>
                    <h2 className="mt-1 font-heading text-2xl tracking-wide text-foreground transition-colors group-hover:text-racing-red">
                      {team.name.toUpperCase()}
                    </h2>
                  </div>
                  {s && (
                    <span className="font-heading text-3xl text-racing-red/60">
                      P{s.position}
                    </span>
                  )}
                </div>

                {/* Drivers */}
                <div className="mt-3 flex items-center gap-4 border-t border-border/30 pt-3">
                  {teamDrivers.map((d) => (
                    <div key={d.code} className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-racing-red/60">{d.code}</span>
                      <span className="text-sm text-muted-foreground">{d.lastName}</span>
                    </div>
                  ))}
                </div>

                {s && (
                  <div className="mt-2 flex items-baseline gap-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.points} pts
                    </span>
                    {s.wins > 0 && (
                      <span className="font-mono text-xs text-terminal-green">
                        {s.wins} win{s.wins === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
