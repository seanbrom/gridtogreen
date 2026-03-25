import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import { getAllBriefings } from "@/lib/kv";
import { ArchiveCard } from "@/components/ArchiveCard";

export const metadata: Metadata = {
  title: "F1 Race Briefing Archive",
  description:
    "Browse all AI-generated Formula 1 race briefings — previews powered by prediction markets, qualifying telemetry, and circuit history.",
};

async function getArchiveData() {
  "use cache";
  cacheLife("max");
  cacheTag("briefing");

  const now = new Date();
  const all = await getAllBriefings();
  // Show full briefings + past previews (race already happened but never got a full briefing)
  return all.filter(
    (b) => b.briefingType !== "preview" || new Date(b.raceDate) <= now
  );
}

export default async function ArchivePage() {
  const briefings = await getArchiveData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-4xl tracking-wide text-foreground md:text-5xl">
          RACE BRIEFINGS
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every AI-generated race preview, from the latest to the first.
        </p>
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No briefings generated yet. Check back on race weekend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {briefings.map((meta) => (
            <ArchiveCard key={meta.slug} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}
