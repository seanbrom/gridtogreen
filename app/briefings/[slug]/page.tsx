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
import {
  buildEventSlug,
  fetchOddsHistoryBySlug,
  resolvePolymarketSlug,
} from "@/lib/polymarket";

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
  const briefing = await getBriefing(slug);

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
  const polymarketUrl = `https://polymarket.com/event/${pmSlug}`;

  // Fetch fresh odds history at render time (cached for hours)
  const oddsHistory = await getOddsHistory(pmSlug).catch(() => []);

  return (
    <>
      <BriefingHero briefing={briefing} />
      <RaceCountdown raceDate={briefing.raceDate} />

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
                        <span className="text-foreground">{q.driverName}</span>
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
  );
}
