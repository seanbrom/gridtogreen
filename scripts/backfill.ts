/**
 * Backfill briefings for past races.
 *
 * Usage:
 *   npx tsx scripts/backfill.ts          # last 2 completed races
 *   npx tsx scripts/backfill.ts 3        # last 3 completed races
 *   npx tsx scripts/backfill.ts --all    # all completed races this season
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Dynamic imports after env is loaded
  const { fetchAllMeetings } = await import("../lib/openf1");
  const { generateFullBriefing } = await import("../lib/briefing-pipeline");

  const arg = process.argv[2];
  const count = arg === "--all" ? Infinity : parseInt(arg || "2", 10);

  console.log("Fetching meetings...");
  const meetings = await fetchAllMeetings();

  const now = new Date();
  const past = meetings
    .filter((m) => new Date(m.date_end) < now)
    .sort(
      (a, b) =>
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    )
    .slice(0, count);

  if (past.length === 0) {
    console.log("No completed races found this season.");
    return;
  }

  console.log(
    `Found ${past.length} completed race(s) to backfill:\n${past.map((m) => `  - ${m.meeting_name} (${m.location}, ${m.date_start.split("T")[0]})`).join("\n")}\n`
  );

  for (const meeting of past) {
    console.log(`\n--- Generating briefing for ${meeting.meeting_name} ---`);
    try {
      const briefing = await generateFullBriefing(meeting);
      console.log(`  Done! Stored as "${briefing.slug}"`);
      console.log(`  Headline: ${briefing.headline}`);
    } catch (err) {
      console.error(
        `  Failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  console.log("\nBackfill complete.");
}

main().catch(console.error);
