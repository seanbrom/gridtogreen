import { cacheLife, cacheTag } from "next/cache";
import { getLatestBriefing, getAllBriefings, getBriefing } from "@/lib/kv";
import { fetchUpcomingRacePreview } from "@/lib/upcoming-race";
import { BriefingHero } from "@/components/briefing/BriefingHero";
import { TheAngle } from "@/components/briefing/TheAngle";
import { OddsWidget } from "@/components/briefing/OddsWidget";
import { OddsChart } from "@/components/briefing/OddsChart";
import { BriefingContent } from "@/components/briefing/BriefingContent";
import { ShareCard } from "@/components/briefing/ShareCard";
import { RaceCountdown } from "@/components/RaceCountdown";
import { ArchiveCard } from "@/components/ArchiveCard";
import { UpcomingRace } from "@/components/UpcomingRace";
import {
  buildEventSlug,
  fetchOddsHistoryBySlug,
  resolvePolymarketSlug,
} from "@/lib/polymarket";

async function getPageData() {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  const [briefing, allBriefings] = await Promise.all([
    getLatestBriefing(),
    getAllBriefings(),
  ]);

  const now = new Date();
  const pastBriefings = allBriefings.filter(
    (b) => b.briefingType !== "preview" || new Date(b.raceDate) <= now
  );
  const previewBriefings = allBriefings
    .filter(
      (b) => b.briefingType === "preview" && new Date(b.raceDate) > now
    )
    .sort(
      (a, b) =>
        new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
    );

  // Latest full briefing (not a preview)
  const latestFull =
    briefing && briefing.briefingType !== "preview" ? briefing : null;

  return { briefing: latestFull, pastBriefings, previewBriefings };
}

async function getUpcomingPreview() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  const all = await getAllBriefings();
  const now = new Date();
  const nextPreview = all
    .filter((b) => b.briefingType === "preview" && new Date(b.raceDate) > now)
    .sort(
      (a, b) =>
        new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
    )[0];
  if (!nextPreview) return null;
  return getBriefing(nextPreview.slug);
}

async function getHomeOddsHistory(polymarketSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("odds-history");

  return fetchOddsHistoryBySlug(polymarketSlug);
}

async function getCachedPmSlug(raceName: string, raceDate: string) {
  "use cache";
  cacheLife("max");
  cacheTag("polymarket-slug");

  return resolvePolymarketSlug(raceName, raceDate);
}

async function getUpcomingData() {
  "use cache";
  cacheLife({ revalidate: 300 }); // refresh every 5 minutes for fresh odds
  cacheTag("upcoming");

  return fetchUpcomingRacePreview();
}

export default async function HomePage() {
  const [{ briefing, pastBriefings, previewBriefings }, upcoming, upcomingPreview] =
    await Promise.all([getPageData(), getUpcomingData(), getUpcomingPreview()]);

  // Check if the latest full briefing is for the upcoming race
  const briefingIsForUpcoming =
    briefing && upcoming && briefing.raceName === upcoming.meeting.meeting_name;

  // Resolve Polymarket data for the upcoming preview
  let previewPmSlug: string | null = null;
  let previewOddsHistory: Awaited<ReturnType<typeof fetchOddsHistoryBySlug>> = [];
  if (upcomingPreview && !briefingIsForUpcoming) {
    previewPmSlug =
      upcomingPreview.polymarketSlug ??
      (await getCachedPmSlug(upcomingPreview.raceName, upcomingPreview.raceDate));
    previewOddsHistory = await getHomeOddsHistory(previewPmSlug).catch(() => []);
  }

  return (
    <>
      {/* Marketing hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-racing-red/8 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <h1 className="font-heading text-5xl tracking-wide text-foreground md:text-7xl lg:text-8xl">
            GRID TO GREEN
          </h1>
          <div className="mt-2 h-1 w-20 bg-racing-red" />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            The smartest F1 race preview on the internet. Before every Grand
            Prix, our AI analyst synthesizes live{" "}
            <span className="text-foreground">prediction market odds</span>,{" "}
            <span className="text-foreground">qualifying telemetry</span>,{" "}
            <span className="text-foreground">historical circuit data</span>,
            and{" "}
            <span className="text-foreground">weather forecasts</span>{" "}
            into one opinionated briefing you can read in five minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-racing-red" />
              Polymarket Odds
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-racing-red" />
              OpenF1 Telemetry
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-racing-red" />
              Circuit History
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-racing-red" />
              Weather Forecasts
            </span>
          </div>
        </div>
      </section>

      {/* If the latest full briefing is for the upcoming race, show it inline */}
      {briefing && briefingIsForUpcoming && (
        <>
          <BriefingHero briefing={briefing} />
          <RaceCountdown raceDate={briefing.raceDate} raceStartTime={briefing.raceStartTime} />

          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BriefingContent sections={briefing.sections} />
              </div>
              <aside className="space-y-6">
                <OddsWidget raceWinner={briefing.odds.raceWinner} />
                <ShareCard slug={briefing.slug} headline={briefing.headline} />
                {briefing.qualifying.results.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card p-6">
                    <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Qualifying Grid
                    </span>
                    <div className="space-y-2">
                      {briefing.qualifying.results.slice(0, 10).map((q) => (
                        <div
                          key={q.driverCode}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                              P{q.position}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {q.driverCode}
                            </span>
                            <span className="text-foreground">
                              {q.driverName}
                            </span>
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {q.position === 1
                              ? q.fastestLapTime
                              : `+${q.gapToPoleSecs.toFixed(3)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </>
      )}

      {/* If no full briefing for the upcoming race, show preview briefing */}
      {!briefingIsForUpcoming && upcomingPreview && (
        <>
          <BriefingHero briefing={upcomingPreview} />
          <RaceCountdown raceDate={upcomingPreview.raceDate} raceStartTime={upcomingPreview.raceStartTime} />

          <div className="mx-auto max-w-7xl px-4 pt-6">
            <div className="flex items-center gap-3 rounded-lg border border-racing-red/20 bg-racing-red/5 px-5 py-3">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-racing-red" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Preview briefing
                </span>{" "}
                — will be updated with qualifying data and weather after
                Saturday&apos;s session.
              </p>
            </div>
          </div>

          {(() => {
            const angleSection = upcomingPreview.sections.find(
              (s) => s.id === "the-angle"
            );
            const remainingSections = upcomingPreview.sections.filter(
              (s) => s.id !== "the-angle"
            );
            const polymarketUrl = previewPmSlug
              ? `https://polymarket.com/event/${previewPmSlug}`
              : null;

            return (
              <>
                {angleSection && polymarketUrl && (
                  <TheAngle
                    content={angleSection.content}
                    polymarketUrl={polymarketUrl}
                  />
                )}

                <div className="mx-auto max-w-7xl px-4 py-8">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                      {previewOddsHistory.length > 0 && (
                        <OddsChart oddsHistory={previewOddsHistory} />
                      )}
                      <BriefingContent sections={remainingSections} />
                    </div>
                    <aside className="space-y-6">
                      <OddsWidget
                        raceWinner={
                          previewOddsHistory.length > 0
                            ? previewOddsHistory.map((d) => ({
                                driverName: d.driverName,
                                driverCode: d.driverCode,
                                impliedProbability: d.currentProbability,
                                price: d.currentProbability,
                              }))
                            : upcomingPreview.odds.raceWinner
                        }
                      />
                      <ShareCard
                        slug={upcomingPreview.slug}
                        headline={upcomingPreview.headline}
                      />
                    </aside>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* Fall back to raw UpcomingRace if no preview briefing exists */}
      {!briefingIsForUpcoming && !upcomingPreview && upcoming && (
        <UpcomingRace data={upcoming} />
      )}

      {/* If no upcoming race data and no briefing, show empty state */}
      {!briefingIsForUpcoming && !upcoming && !upcomingPreview && !briefing && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
          <div className="text-center">
            <h1 className="font-heading text-5xl tracking-wide text-foreground md:text-7xl">
              GRID TO GREEN
            </h1>
            <div className="mx-auto mt-2 h-1 w-16 bg-racing-red" />
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              AI-powered race briefings that synthesize prediction markets,
              qualifying telemetry, and circuit history into one smart preview.
            </p>
          </div>
        </div>
      )}

      {/* Latest full briefing card (when not shown inline above) */}
      {!briefingIsForUpcoming && briefing && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-6 font-heading text-2xl tracking-wide text-foreground">
              LATEST BRIEFING
            </h2>
            <ArchiveCard
              meta={{
                slug: briefing.slug,
                raceName: briefing.raceName,
                location: briefing.location,
                raceDate: briefing.raceDate,
                generatedAt: briefing.generatedAt,
                headline: briefing.headline,
                summary: briefing.summary,
                keyNumber: briefing.keyNumber,
              }}
            />
          </div>
        </section>
      )}

      {/* Past briefings */}
      {pastBriefings.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-6 font-heading text-2xl tracking-wide text-foreground">
              PAST BRIEFINGS
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastBriefings
                .filter((m) => m.slug !== briefing?.slug)
                .slice(0, 6)
                .map((meta) => (
                  <ArchiveCard key={meta.slug} meta={meta} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Preview briefings */}
      {previewBriefings.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-6 font-heading text-2xl tracking-wide text-foreground">
              PREVIEW BRIEFINGS
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {previewBriefings.slice(0, 6).map((meta) => (
                <ArchiveCard key={meta.slug} meta={meta} showPreviewBadge />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
