import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBriefing, getAllBriefings } from "@/lib/kv";
import { BriefingHero } from "@/components/briefing/BriefingHero";
import { OddsWidget } from "@/components/briefing/OddsWidget";
import { BriefingContent } from "@/components/briefing/BriefingContent";
import { ShareCard } from "@/components/briefing/ShareCard";
import { RaceCountdown } from "@/components/RaceCountdown";

async function getBriefingData(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  return getBriefing(slug);
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

  return (
    <>
      <BriefingHero briefing={briefing} />
      <RaceCountdown raceDate={briefing.raceDate} />

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
