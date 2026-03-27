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
import { DataTicker, type TickerItem } from "@/components/home/DataTicker";
import { HeroTitle } from "@/components/home/HeroTitle";
import { ExplainerGrid } from "@/components/home/ExplainerGrid";
import { RacingStripe } from "@/components/home/RacingStripe";
import {
  fetchOddsHistoryBySlug,
  resolvePolymarketSlug,
} from "@/lib/polymarket";
import { QualifyingGrid } from "@/components/briefing/QualifyingGrid";

async function getPageData() {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  const [briefing, allBriefings] = await Promise.all([
    getLatestBriefing(),
    getAllBriefings(),
  ]);

  const now = new Date();
  // Keep showing current GP briefings for 1 day after race day
  const oneDayMs = 24 * 60 * 60 * 1000;
  const pastBriefings = allBriefings.filter(
    (b) => b.briefingType !== "preview" || new Date(b.raceDate).getTime() + oneDayMs <= now.getTime()
  );
  const previewBriefings = allBriefings
    .filter(
      (b) => b.briefingType === "preview" && new Date(b.raceDate).getTime() + oneDayMs > now.getTime()
    )
    .sort(
      (a, b) =>
        new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
    );

  // Latest full briefing (not a preview or cancelled)
  const latestFull =
    briefing && briefing.briefingType !== "preview" && briefing.briefingType !== "cancelled" ? briefing : null;

  return { briefing: latestFull, pastBriefings, previewBriefings };
}

async function getUpcomingPreview() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  const all = await getAllBriefings();
  const now = new Date();
  // Keep showing current GP preview for 1 day after race day
  const oneDayMs = 24 * 60 * 60 * 1000;
  const nextPreview = all
    .filter((b) => b.briefingType === "preview" && new Date(b.raceDate).getTime() + oneDayMs > now.getTime())
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

  // Assemble ticker data from upcoming race
  const tickerItems: TickerItem[] = [];
  if (upcoming) {
    upcoming.odds.raceWinner.slice(0, 5).forEach((d) => {
      tickerItems.push({
        label: d.driverCode,
        value: `${Math.round(d.impliedProbability * 100)}%`,
        trend: d.impliedProbability > 0.15 ? "up" : "neutral",
      });
    });
    if (upcoming.driverStandings[0]) {
      const leader = upcoming.driverStandings[0];
      tickerItems.push({
        label: "WDC LEADER",
        value: `${leader.code} ${leader.points}pts`,
        trend: "up",
      });
    }
    if (upcoming.constructorStandings[0]) {
      const leader = upcoming.constructorStandings[0];
      tickerItems.push({
        label: "WCC LEADER",
        value: `${leader.constructorName} ${leader.points}pts`,
      });
    }
    if (upcoming.weather) {
      tickerItems.push({
        label: "RACE TEMP",
        value: `${Math.round(upcoming.weather.maxTempC)}\u00B0C`,
      });
      tickerItems.push({
        label: "RAIN",
        value: `${upcoming.weather.precipitationProbability}%`,
        trend: upcoming.weather.precipitationProbability > 40 ? "up" : "down",
      });
    }
    tickerItems.push({
      label: "NEXT GP",
      value: upcoming.meeting.meeting_name.toUpperCase(),
    });
  }

  return (
    <>
      {/* Marketing hero */}
      <section className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-racing-red/10 via-background to-background" />
        <div className="hero-grid-overlay absolute inset-0" />
        <div className="scanline-overlay absolute inset-0" />
        {/* Ambient glow */}
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-racing-red/5 blur-[128px]"
          style={{ animation: "hero-glow 8s ease-in-out infinite" }}
        />

        {/* Data ticker */}
        <div className="relative">
          <DataTicker items={tickerItems} />
        </div>

        {/* Hero content */}
        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-10 md:pt-20 md:pb-14">
          <HeroTitle />
          <ExplainerGrid />
        </div>

        {/* Bottom racing stripe */}
        <RacingStripe variant="bold" />
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
                <QualifyingGrid results={briefing.qualifying.results} />
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
                Updated with qualifying data and weather after
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
            <h1 className="font-heading text-6xl tracking-wider text-foreground md:text-8xl">
              GRID TO <span className="text-terminal-green">GREEN</span>
            </h1>
            <div
              className="mx-auto mt-3 h-0.5 w-20 origin-center bg-racing-red"
              style={{ animation: "stripe-extend 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            />
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              SYS:STANDBY // AWAITING RACE DATA
            </p>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              One briefing per race. Four data sources. An actual opinion
              on who wins and why.
            </p>
          </div>
        </div>
      )}

      {/* Latest full briefing card (when not shown inline above) */}
      {!briefingIsForUpcoming && briefing && (
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-heading text-2xl tracking-wide text-foreground">
                LATEST BRIEFING
              </h2>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                //&nbsp;MOST_RECENT
              </span>
            </div>
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
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-heading text-2xl tracking-wide text-foreground">
                PAST BRIEFINGS
              </h2>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                //&nbsp;ARCHIVE
              </span>
            </div>
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
        <section className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-heading text-2xl tracking-wide text-foreground">
                PREVIEW BRIEFINGS
              </h2>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                //&nbsp;UPCOMING
              </span>
            </div>
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
