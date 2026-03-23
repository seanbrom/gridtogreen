import {
  fetchNextMeeting,
  buildQualifyingResults,
  fetchQualifyingWeatherSummary,
} from "./openf1";
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchCircuitInfo,
  fetchCircuitHistory,
} from "./jolpica";
import { fetchAllRaceOdds } from "./polymarket";
import { fetchRaceDayForecast } from "./weather";
import { generateBriefing } from "./claude";
import { storeBriefing } from "./kv";
import { CIRCUIT_MAP } from "./circuits";
import type { Briefing, BriefingContext, OpenF1Meeting } from "@/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateFullBriefing(
  targetMeeting?: OpenF1Meeting
): Promise<Briefing> {
  // Step 1: Find the race
  const meeting = targetMeeting ?? (await fetchNextMeeting());
  if (!meeting) {
    throw new Error("No upcoming meeting found");
  }

  const circuitId = CIRCUIT_MAP[meeting.circuit_short_name] ?? null;

  // Step 2: Fetch all data in parallel
  const [
    qualifyingResults,
    qualifyingWeather,
    driverStandings,
    constructorStandings,
    circuitInfo,
    historicalResults,
    odds,
  ] = await Promise.all([
    buildQualifyingResults(meeting.meeting_key).catch(() => null),
    fetchQualifyingWeatherSummary(meeting.meeting_key).catch(() => null),
    fetchDriverStandings().catch(() => []),
    fetchConstructorStandings().catch(() => []),
    circuitId ? fetchCircuitInfo(circuitId).catch(() => null) : Promise.resolve(null),
    circuitId ? fetchCircuitHistory(circuitId, 5).catch(() => []) : Promise.resolve([]),
    fetchAllRaceOdds(meeting.meeting_name, meeting.date_end).catch(() => ({
      raceWinner: [],
      headToHeads: [],
    })),
  ]);

  // Step 3: Fetch weather (needs lat/lng from circuit info)
  let weatherForecast = null;
  if (circuitInfo) {
    try {
      weatherForecast = await fetchRaceDayForecast(
        circuitInfo.lat,
        circuitInfo.lng,
        meeting.date_start
      );
    } catch {
      // Weather is optional
    }
  }

  // Step 4: Compute derived data for circuit history
  const winners = historicalResults
    .filter((r) => r.position === 1)
    .sort((a, b) => b.season - a.season);

  const teamWins = new Map<string, number>();
  for (const w of winners) {
    teamWins.set(w.constructorName, (teamWins.get(w.constructorName) ?? 0) + 1);
  }
  const dominantTeams = Array.from(teamWins.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([team]) => team);

  const slug = slugify(
    `${meeting.year}-${meeting.meeting_name.replace(/\d{4}\s*/g, "")}`
  );

  // Step 5: Assemble BriefingContext
  const context: BriefingContext = {
    race: {
      name: meeting.meeting_name,
      slug,
      circuit: circuitInfo?.circuitName ?? meeting.circuit_short_name,
      location: `${circuitInfo?.locality ?? meeting.location}, ${circuitInfo?.country ?? meeting.country_name}`,
      raceDate: meeting.date_start,
      laps: 0, // Not available from these APIs at this level
      circuitLengthKm: 0,
    },
    qualifying: {
      results: (qualifyingResults ?? []).map((q) => ({
        position: q.position,
        driverCode: q.driverCode,
        driverName: q.driverName,
        team: q.team,
        fastestLapTime: q.fastestLapTime,
        gapToPoleSecs: q.gapToPoleSecs,
        tireCompoundUsed: q.tireCompoundUsed,
      })),
      sessionConditions: qualifyingWeather ?? {
        trackTempC: 0,
        airTempC: 0,
        humidity: 0,
        wasWet: false,
      },
    },
    odds: {
      raceWinner: odds.raceWinner,
      headToHeads: odds.headToHeads,
    },
    circuitHistory: {
      recentWinners: winners.slice(0, 5).map((w) => ({
        year: w.season,
        winner: w.driverName,
        team: w.constructorName,
        startingPosition: w.grid,
        fastestLap: w.fastestLapTime ?? "N/A",
        safetyCars: null,
      })),
      dominantTeams,
      averageLeadChanges: null,
      safetyCarFrequency: "Unknown",
    },
    standings: {
      drivers: driverStandings.slice(0, 20).map((d) => ({
        position: d.position,
        driverName: `${d.givenName} ${d.familyName}`,
        driverCode: d.code,
        team: d.constructorName,
        points: d.points,
      })),
      constructors: constructorStandings.slice(0, 10).map((c) => ({
        position: c.position,
        team: c.constructorName,
        points: c.points,
      })),
    },
    weather: {
      raceDayForecast: weatherForecast ?? {
        conditionSummary: "Forecast unavailable",
        maxTempC: 0,
        precipitationProbability: 0,
        windSpeedKmh: 0,
      },
    },
  };

  // Step 6: Generate briefing via Claude
  const generated = await generateBriefing(context);

  // Step 7: Assemble and store
  const briefing: Briefing = {
    slug,
    raceName: meeting.meeting_name,
    circuit: circuitInfo?.circuitName ?? meeting.circuit_short_name,
    location: circuitInfo?.locality ?? meeting.location,
    country: circuitInfo?.country ?? meeting.country_name,
    raceDate: meeting.date_start,
    generatedAt: new Date().toISOString(),
    headline: generated.headline,
    summary: generated.summary,
    keyNumber: generated.keyNumber,
    sections: generated.sections,
    odds: {
      raceWinner: odds.raceWinner,
      headToHeads: odds.headToHeads,
    },
    qualifying: context.qualifying,
    weather: weatherForecast
      ? { raceDayForecast: weatherForecast }
      : null,
  };

  await storeBriefing(briefing);

  return briefing;
}
