import { fetchWithRetry } from "./fetch-utils";
import type {
  DriverStanding,
  ConstructorStanding,
  CircuitInfo,
  HistoricalRaceResult,
} from "@/types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDriverStanding(raw: any): DriverStanding {
  return {
    position: parseInt(raw.position, 10),
    points: parseFloat(raw.points),
    wins: parseInt(raw.wins, 10),
    driverId: raw.Driver.driverId,
    code: raw.Driver.code ?? "",
    givenName: raw.Driver.givenName,
    familyName: raw.Driver.familyName,
    constructorName: raw.Constructors?.[0]?.name ?? "Unknown",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConstructorStanding(raw: any): ConstructorStanding {
  return {
    position: parseInt(raw.position, 10),
    points: parseFloat(raw.points),
    wins: parseInt(raw.wins, 10),
    constructorId: raw.Constructor.constructorId,
    constructorName: raw.Constructor.name,
  };
}

export async function fetchDriverStandings(
  season: string = "current"
): Promise<DriverStanding[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchWithRetry<any>(
    `${BASE_URL}/${season}/driverStandings.json`
  );

  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
  if (!Array.isArray(standings)) return [];

  return standings.map(parseDriverStanding);
}

export async function fetchConstructorStandings(
  season: string = "current"
): Promise<ConstructorStanding[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchWithRetry<any>(
    `${BASE_URL}/${season}/constructorStandings.json`
  );

  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
  if (!Array.isArray(standings)) return [];

  return standings.map(parseConstructorStanding);
}

export async function fetchCircuitInfo(
  circuitId: string
): Promise<CircuitInfo | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchWithRetry<any>(
    `${BASE_URL}/circuits/${circuitId}.json`
  );

  const circuit = data?.MRData?.CircuitTable?.Circuits?.[0];
  if (!circuit) return null;

  return {
    circuitId: circuit.circuitId,
    circuitName: circuit.circuitName,
    lat: parseFloat(circuit.Location.lat),
    lng: parseFloat(circuit.Location.long),
    locality: circuit.Location.locality,
    country: circuit.Location.country,
  };
}

export async function fetchCircuitHistory(
  circuitId: string,
  years: number = 5
): Promise<HistoricalRaceResult[]> {
  const currentYear = new Date().getFullYear();
  const results: HistoricalRaceResult[] = [];

  // Fetch each year in parallel
  const yearFetches = Array.from({ length: years }, (_, i) => {
    const year = currentYear - 1 - i;
    return fetchWithRetry<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >(`${BASE_URL}/${year}/circuits/${circuitId}/results.json`).catch(
      () => null
    );
  });

  const responses = await Promise.all(yearFetches);

  for (const data of responses) {
    if (!data) continue;
    const races = data?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races)) continue;

    for (const race of races) {
      const season = parseInt(race.season, 10);
      const round = parseInt(race.round, 10);
      if (!Array.isArray(race.Results)) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const result of race.Results) {
        results.push({
          season,
          round,
          raceName: race.raceName,
          position: parseInt(result.position, 10),
          grid: parseInt(result.grid, 10),
          driverCode: result.Driver?.code ?? "",
          driverName: `${result.Driver?.givenName ?? ""} ${result.Driver?.familyName ?? ""}`.trim(),
          constructorName: result.Constructor?.name ?? "Unknown",
          laps: parseInt(result.laps, 10),
          status: result.status,
          time: result.Time?.time ?? null,
          fastestLapTime: result.FastestLap?.Time?.time ?? null,
        });
      }
    }
  }

  return results.sort((a, b) => b.season - a.season || a.position - b.position);
}

export interface ConstructorSeasonResult {
  round: number;
  raceName: string;
  circuitId: string;
  results: {
    position: number;
    grid: number;
    points: number;
    laps: number;
    status: string;
    driverId: string;
    driverCode: string;
    driverName: string;
    time: string | null;
  }[];
}

export async function fetchConstructorSeasonResults(
  constructorId: string,
  season: string = "current"
): Promise<ConstructorSeasonResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchWithRetry<any>(
    `${BASE_URL}/${season}/constructors/${constructorId}/results.json?limit=200`
  );

  const races = data?.MRData?.RaceTable?.Races;
  if (!Array.isArray(races)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return races.map((race: any) => ({
    round: parseInt(race.round, 10),
    raceName: race.raceName as string,
    circuitId: race.Circuit?.circuitId ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results: (race.Results ?? []).map((r: any) => ({
      position: parseInt(r.position, 10),
      grid: parseInt(r.grid, 10),
      points: parseFloat(r.points),
      laps: parseInt(r.laps, 10),
      status: r.status,
      driverId: r.Driver?.driverId ?? "",
      driverCode: r.Driver?.code ?? "",
      driverName: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim(),
      time: r.Time?.time ?? null,
    })),
  }));
}

export interface DriverSeasonResult {
  round: number;
  raceName: string;
  circuitId: string;
  position: number;
  grid: number;
  points: number;
  laps: number;
  status: string;
  time: string | null;
  fastestLapTime: string | null;
  constructorName: string;
}

export async function fetchDriverSeasonResults(
  driverId: string,
  season: string = "current"
): Promise<DriverSeasonResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchWithRetry<any>(
    `${BASE_URL}/${season}/drivers/${driverId}/results.json?limit=100`
  );

  const races = data?.MRData?.RaceTable?.Races;
  if (!Array.isArray(races)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return races.map((race: any) => {
    const result = race.Results?.[0];
    if (!result) return null;
    return {
      round: parseInt(race.round, 10),
      raceName: race.raceName as string,
      circuitId: race.Circuit?.circuitId ?? "",
      position: parseInt(result.position, 10),
      grid: parseInt(result.grid, 10),
      points: parseFloat(result.points),
      laps: parseInt(result.laps, 10),
      status: result.status,
      time: result.Time?.time ?? null,
      fastestLapTime: result.FastestLap?.Time?.time ?? null,
      constructorName: result.Constructor?.name ?? "Unknown",
    };
  }).filter((r: DriverSeasonResult | null): r is DriverSeasonResult => r !== null);
}
