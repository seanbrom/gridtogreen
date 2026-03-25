import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBriefing, getAllBriefings } from "@/lib/kv";
import { BriefingHero } from "@/components/briefing/BriefingHero";
import { TheAngle } from "@/components/briefing/TheAngle";
import { OddsWidget } from "@/components/briefing/OddsWidget";
import { BriefingContent } from "@/components/briefing/BriefingContent";
import { ShareCard } from "@/components/briefing/ShareCard";
import { RaceCountdown } from "@/components/RaceCountdown";
import { OddsChart } from "@/components/briefing/OddsChart";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArchiveCard } from "@/components/ArchiveCard";
import {
  buildEventSlug,
  fetchOddsHistoryBySlug,
  resolvePolymarketSlug,
} from "@/lib/polymarket";
import { getBaseUrl } from "@/lib/utils";
import { findCircuitIdForBriefing, getCircuitMeta } from "@/lib/circuits";
import { getDriverByCode } from "@/lib/drivers";
import Link from "next/link";

async function getBriefingData(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return getBriefing(slug);
}

async function getCachedPolymarketSlug(raceName: string, raceDate: string) {
  "use cache";
  cacheLife("max");
  cacheTag("polymarket-slug");

  return resolvePolymarketSlug(raceName, raceDate);
}

async function getOddsHistory(polymarketSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("odds-history");

  return fetchOddsHistoryBySlug(polymarketSlug);
}

async function getCachedAllBriefings() {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return getAllBriefings();
}

export async function generateStaticParams() {
  const briefings = await getAllBriefings();
  const params = briefings.map((b) => ({ slug: b.slug }));
  // Must return at least one entry for cacheComponents build validation
  if (params.length === 0) {
    return [{ slug: "_placeholder" }];
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const briefing = await getBriefingData(slug);

  if (!briefing) {
    return { title: "Briefing Not Found" };
  }

  return {
    title: briefing.raceName,
    description: briefing.summary,
    openGraph: {
      title: `${briefing.headline} | Grid to Green`,
      description: briefing.summary,
    },
  };
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const briefing = await getBriefingData(slug);

  if (!briefing) {
    notFound();
  }

  const angleSection = briefing.sections.find((s) => s.id === "the-angle");
  const remainingSections = briefing.sections.filter(
    (s) => s.id !== "the-angle"
  );

  // Use stored slug or resolve it by trying date offsets from the stored raceDate.
  // Legacy briefings store the Friday meeting start; the Polymarket slug uses the
  // actual race day which varies (+1 to +2 days).
  const pmSlug =
    briefing.polymarketSlug ??
    (await getCachedPolymarketSlug(briefing.raceName, briefing.raceDate));

  // Fetch odds history and all briefings in parallel (independent of each other)
  const [oddsHistory, allBriefings] = await Promise.all([
    getOddsHistory(pmSlug).catch(() => []),
    getCachedAllBriefings(),
  ]);

  const polymarketUrl = `https://polymarket.com/event/${pmSlug}`;

  const raceTimeMs = new Date(briefing.raceDate).getTime();
  const relatedBriefings = allBriefings
    .filter((b) => b.slug !== briefing.slug)
    .map((b) => ({
      meta: b,
      distance: Math.abs(new Date(b.raceDate).getTime() - raceTimeMs),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((x) => x.meta);

  const baseUrl = getBaseUrl();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: briefing.headline,
            description: briefing.summary,
            datePublished: briefing.generatedAt,
            dateModified: briefing.generatedAt,
            author: {
              "@type": "Organization",
              name: "Grid to Green",
              url: baseUrl,
            },
            publisher: {
              "@type": "Organization",
              name: "Grid to Green",
              url: baseUrl,
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${baseUrl}/briefings/${briefing.slug}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: baseUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Briefings",
                item: `${baseUrl}/archive`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: briefing.raceName,
                item: `${baseUrl}/briefings/${briefing.slug}`,
              },
            ],
          }),
        }}
      />
      <Breadcrumbs raceName={briefing.raceName} />
      <BriefingHero briefing={briefing} />
      <RaceCountdown raceDate={briefing.raceDate} raceStartTime={briefing.raceStartTime} />

      {briefing.briefingType === "preview" && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="flex items-center gap-3 rounded-lg border border-racing-red/20 bg-racing-red/5 px-5 py-3">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-racing-red" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Preview briefing
              </span>{" "}
              — this will be updated with qualifying data and weather after
              Saturday&apos;s session.
            </p>
          </div>
        </div>
      )}

      {angleSection && (
        <TheAngle
          content={angleSection.content}
          polymarketUrl={polymarketUrl}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {oddsHistory.length > 0 && (
              <OddsChart oddsHistory={oddsHistory} />
            )}
            <BriefingContent sections={remainingSections} />
          </div>

          <aside className="space-y-6">
            <OddsWidget
              raceWinner={
                oddsHistory.length > 0
                  ? oddsHistory.map((d) => ({
                      driverName: d.driverName,
                      driverCode: d.driverCode,
                      impliedProbability: d.currentProbability,
                      price: d.currentProbability,
                    }))
                  : briefing.odds.raceWinner
              }
            />
            <ShareCard slug={briefing.slug} headline={briefing.headline} />

            {briefing.qualifying.results.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Qualifying Grid
                </span>
                <div className="space-y-2">
                  {briefing.qualifying.results.slice(0, 10).map((q) => {
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
                              <span className="text-foreground">
                                {q.driverName}
                              </span>
                            </Link>
                          ) : (
                            <>
                              <span className="font-mono text-xs text-muted-foreground">
                                {q.driverCode}
                              </span>
                              <span className="text-foreground">
                                {q.driverName}
                              </span>
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
            )}

            {/* Circuit link */}
            {(() => {
              const circuitId = findCircuitIdForBriefing(briefing.circuit);
              const circuitMeta = circuitId
                ? getCircuitMeta(circuitId)
                : undefined;
              if (!circuitMeta) return null;
              return (
                <Link
                  href={`/circuits/${circuitMeta.circuitId}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-racing-red/40"
                >
                  <span className="text-racing-red">&rarr;</span>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      Circuit Guide
                    </div>
                    <div className="text-foreground">
                      {circuitMeta.grandPrixName.replace(" Grand Prix", "")} history &amp; stats
                    </div>
                  </div>
                </Link>
              );
            })()}
          </aside>
        </div>
      </div>

      {relatedBriefings.length > 0 && (
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-heading text-2xl tracking-wide text-foreground">
                MORE BRIEFINGS
              </h2>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                //&nbsp;RELATED
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedBriefings.map((meta) => (
                <ArchiveCard key={meta.slug} meta={meta} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
