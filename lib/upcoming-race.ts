import { fetchNextMeeting } from "./openf1";
import {
  fetchCircuitInfo,
  fetchCircuitHistory,
  fetchDriverStandings,
  fetchConstructorStandings,
} from "./jolpica";
import { fetchAllRaceOdds } from "./polymarket";
import { fetchRaceDayForecast } from "./weather";
import { CIRCUIT_MAP } from "./circuits";
import type {
  OpenF1Meeting,
  CircuitInfo,
  HistoricalRaceResult,
  DriverStanding,
  ConstructorStanding,
  DriverOdds,
  H2HMarket,
  WeatherForecast,
} from "@/types";

export interface UpcomingRaceData {
  meeting: OpenF1Meeting;
  circuit: CircuitInfo | null;
  history: HistoricalRaceResult[];
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  odds: {
    raceWinner: DriverOdds[];
    headToHeads: H2HMarket[];
  };
  weather: WeatherForecast | null;
  recentWinners: Array<{
    season: number;
    driverName: string;
    constructorName: string;
    grid: number;
  }>;
}

export async function fetchUpcomingRacePreview(): Promise<UpcomingRaceData | null> {
  const meeting = await fetchNextMeeting();
  if (!meeting) return null;

  const circuitId = CIRCUIT_MAP[meeting.circuit_short_name] ?? null;

  const [circuit, history, driverStandings, constructorStandings, odds] =
    await Promise.all([
      circuitId
        ? fetchCircuitInfo(circuitId).catch(() => null)
        : Promise.resolve(null),
      circuitId
        ? fetchCircuitHistory(circuitId, 5).catch(() => [])
        : Promise.resolve([]),
      fetchDriverStandings().catch(() => []),
      fetchConstructorStandings().catch(() => []),
      fetchAllRaceOdds(meeting.meeting_name, meeting.date_end).catch(() => ({
        raceWinner: [] as DriverOdds[],
        headToHeads: [] as H2HMarket[],
      })),
    ]);

  let weather: WeatherForecast | null = null;
  if (circuit) {
    try {
      weather = await fetchRaceDayForecast(
        circuit.lat,
        circuit.lng,
        meeting.date_start
      );
    } catch {
      // Weather is optional
    }
  }

  const recentWinners = history
    .filter((r) => r.position === 1)
    .sort((a, b) => b.season - a.season)
    .slice(0, 5)
    .map((r) => ({
      season: r.season,
      driverName: r.driverName,
      constructorName: r.constructorName,
      grid: r.grid,
    }));

  return {
    meeting,
    circuit,
    history,
    driverStandings,
    constructorStandings,
    odds,
    weather,
    recentWinners,
  };
}
