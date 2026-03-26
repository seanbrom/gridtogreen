import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { DRIVERS, TEAMS } from "@/lib/drivers";
import { fetchDriverStandings } from "@/lib/jolpica";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "F1 Drivers",
  description:
    "Every driver on the 2026 Formula 1 grid. Season stats, championship standings, race results, and pre-race briefings for all 20 drivers.",
  openGraph: {
    title: "F1 Drivers | Grid to Green",
    description:
      "Stats and standings for every driver on the 2026 F1 grid.",
  },
};

async function getCachedStandings() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return fetchDriverStandings().catch(() => []);
}

export default async function DriversPage() {
  const standings = await getCachedStandings();
  const standingsMap = new Map(standings.map((s) => [s.driverId, s]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Home" },
              { label: "Drivers", href: "/drivers" },
            ])
          ),
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Drivers" },
        ]}
      />

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-10">
        <h1 className="font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          F1 <span className="text-terminal-green">DRIVERS</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The 2026 Formula 1 grid. Select a driver to see their season stats,
          race results, and related briefings.
        </p>
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Drivers by team */}
      <div className="mx-auto max-w-7xl px-4 pb-16">
        <div className="space-y-8">
          {TEAMS.map((team) => {
            const teamDrivers = DRIVERS.filter((d) => d.team === team);
            if (teamDrivers.length === 0) return null;

            return (
              <section key={team}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="font-heading text-xl tracking-wide text-foreground">
                    {team.toUpperCase()}
                  </h2>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                    //&nbsp;{teamDrivers.map((d) => d.code).join("_")}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {teamDrivers.map((driver) => {
                    const s = standingsMap.get(driver.driverId);

                    return (
                      <Link
                        key={driver.driverId}
                        href={`/drivers/${driver.driverId}`}
                        className="group relative block overflow-hidden rounded-lg border border-border/60 bg-card p-5 transition-all hover:border-racing-red/40 hover:shadow-[0_0_24px_rgba(232,0,45,0.08)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-racing-red via-racing-red/60 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />

                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                              #{driver.number} &middot; {driver.nationality}
                            </div>
                            <h3 className="mt-1 font-heading text-2xl tracking-wide text-foreground transition-colors group-hover:text-racing-red">
                              <span className="text-muted-foreground/40">
                                {driver.firstName.toUpperCase()}{" "}
                              </span>
                              {driver.lastName.toUpperCase()}
                            </h3>
                          </div>
                          <span className="font-mono text-2xl text-racing-red/60">
                            {driver.code}
                          </span>
                        </div>

                        {s && (
                          <div className="mt-3 flex items-baseline gap-4 border-t border-border/30 pt-3">
                            <span className="font-heading text-2xl text-foreground">
                              P{s.position}
                            </span>
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
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
