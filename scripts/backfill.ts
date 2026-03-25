/**
 * Backfill briefings (full and/or preview) to any Upstash environment.
 *
 * Usage:
 *   # Full briefings for past races (uses .env.local by default)
 *   npx tsx scripts/backfill.ts --full
 *   npx tsx scripts/backfill.ts --full 3          # last 3 completed races
 *   npx tsx scripts/backfill.ts --full --all       # all completed races
 *
 *   # Preview briefings for upcoming races
 *   npx tsx scripts/backfill.ts --previews
 *   npx tsx scripts/backfill.ts --previews 5       # first 5 upcoming
 *
 *   # Both
 *   npx tsx scripts/backfill.ts --full --previews
 *
 *   # Target a specific environment by setting env vars:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npx tsx scripts/backfill.ts --previews
 *
 *   # Or point to a specific .env file:
 *   ENV_FILE=.env.production npx tsx scripts/backfill.ts --full --previews
 */

import { config } from "dotenv";

// Load env from custom file or .env.local
const envFile = process.env.ENV_FILE ?? ".env.local";
config({ path: envFile });

// Map Vercel KV env vars to Upstash env vars if needed
if (!process.env.UPSTASH_REDIS_REST_URL && process.env.KV_REST_API_URL) {
  process.env.UPSTASH_REDIS_REST_URL = process.env.KV_REST_API_URL;
}
if (!process.env.UPSTASH_REDIS_REST_TOKEN && process.env.KV_REST_API_TOKEN) {
  process.env.UPSTASH_REDIS_REST_TOKEN = process.env.KV_REST_API_TOKEN;
}

async function main() {
  const { fetchAllMeetings } = await import("../lib/openf1");
  const {
    generateFullBriefing,
    generatePreviewBriefing,
  } = await import("../lib/briefing-pipeline");
  const { getBriefing } = await import("../lib/kv");

  const args = process.argv.slice(2);
  const doFull = args.includes("--full");
  const doPreviews = args.includes("--previews");
  const doAll = args.includes("--all");

  if (!doFull && !doPreviews) {
    console.log("Usage: npx tsx scripts/backfill.ts [--full] [--previews] [count|--all]");
    console.log("  --full       Generate full briefings for past races");
    console.log("  --previews   Generate preview briefings for upcoming races");
    console.log("  --all        Process all races (default: 2 for full, all for previews)");
    console.log("  [number]     Limit to N races");
    console.log("\nEnv: Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to target a specific environment.");
    process.exit(1);
  }

  const numArg = args.find((a) => /^\d+$/.test(a));
  const limit = doAll ? Infinity : numArg ? parseInt(numArg, 10) : undefined;

  const target = process.env.UPSTASH_REDIS_REST_URL
    ? `Upstash (${process.env.UPSTASH_REDIS_REST_URL.replace(/https?:\/\//, "").split(".")[0]}...)`
    : "local JSON store";
  console.log(`Target: ${target}\n`);

  const meetings = await fetchAllMeetings();
  const now = new Date();

  if (doFull) {
    const past = meetings
      .filter((m) => new Date(m.date_end) < now)
      .sort(
        (a, b) =>
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
      )
      .slice(0, limit ?? 2);

    console.log(`=== Full briefings (${past.length} past races) ===`);
    for (const meeting of past) {
      const slug = meeting.meeting_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const existing = await getBriefing(`${meeting.year}-${slug}`).catch(() => null);
      if (existing?.briefingType === "full") {
        console.log(`  SKIP  ${meeting.meeting_name} (already full)`);
        continue;
      }

      try {
        console.log(`  GEN   ${meeting.meeting_name}...`);
        const briefing = await generateFullBriefing(meeting);
        console.log(`  DONE  ${briefing.slug} — "${briefing.headline}"`);
      } catch (err) {
        console.error(`  FAIL  ${meeting.meeting_name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log();
  }

  if (doPreviews) {
    const upcoming = meetings
      .filter((m) => new Date(m.date_end) >= now)
      .sort(
        (a, b) =>
          new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      )
      .slice(0, limit ?? Infinity);

    console.log(`=== Preview briefings (${upcoming.length} upcoming races) ===`);
    for (const meeting of upcoming) {
      const slug = `${meeting.year}-${meeting.meeting_name.replace(/\d{4}\s*/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      const existing = await getBriefing(slug).catch(() => null);
      if (existing?.briefingType === "full") {
        console.log(`  SKIP  ${meeting.meeting_name} (already full)`);
        continue;
      }

      try {
        console.log(`  GEN   ${meeting.meeting_name}...`);
        const briefing = await generatePreviewBriefing(meeting);
        console.log(`  DONE  ${briefing.slug} — "${briefing.headline}"`);
      } catch (err) {
        console.error(`  FAIL  ${meeting.meeting_name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log();
  }

  console.log("Backfill complete.");
}

main().catch(console.error);
