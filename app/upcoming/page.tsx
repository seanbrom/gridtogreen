import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import { getAllBriefings } from "@/lib/kv";
import { ArchiveCard } from "@/components/ArchiveCard";

export const metadata: Metadata = {
  title: "Upcoming Races",
  description: "Preview briefings for upcoming F1 races.",
};

async function getUpcomingData() {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  const now = new Date();
  // Keep showing current GP preview for 1 day after race day
  const oneDayMs = 24 * 60 * 60 * 1000;
  const all = await getAllBriefings();
  return all
    .filter(
      (b) =>
        b.briefingType === "preview" && new Date(b.raceDate).getTime() + oneDayMs > now.getTime()
    )
    .sort(
      (a, b) =>
        new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
    );
}

export default async function UpcomingPage() {
  const briefings = await getUpcomingData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-4xl tracking-wide text-foreground md:text-5xl">
          UPCOMING RACES
        </h1>
        <p className="mt-2 text-muted-foreground">
          Early reads on every race left on the calendar. Full briefings
          publish after qualifying.
        </p>
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No upcoming race previews yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {briefings.map((meta) => (
            <ArchiveCard key={meta.slug} meta={meta} showPreviewBadge />
          ))}
        </div>
      )}
    </div>
  );
}
