import { fetchWithRetry } from "./fetch-utils";
import type {
  OpenF1Meeting,
  OpenF1Session,
  OpenF1Lap,
  OpenF1Stint,
  OpenF1Weather,
  OpenF1Driver,
} from "@/types";

const BASE_URL = "https://api.openf1.org/v1";

export async function fetchAllMeetings(
  year?: number
): Promise<OpenF1Meeting[]> {
  const y = year ?? new Date().getFullYear();
  return fetchWithRetry<OpenF1Meeting[]>(`${BASE_URL}/meetings?year=${y}`);
}

export async function fetchNextMeeting(): Promise<OpenF1Meeting | null> {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  // Try current year first
  const meetings = await fetchWithRetry<OpenF1Meeting[]>(
    `${BASE_URL}/meetings?year=${year}`
  );

  // Find the next upcoming meeting, or the most recent one if mid-weekend
  const upcoming = meetings
    .filter((m) => m.date_end >= now)
    .sort(
      (a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );

  if (upcoming.length > 0) return upcoming[0];

  // If no upcoming this year, return the most recent
  const sorted = meetings.sort(
    (a, b) =>
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
  );
  return sorted[0] ?? null;
}

export async function fetchRaceSessionStart(
  meetingKey: number
): Promise<string | null> {
  const sessions = await fetchWithRetry<OpenF1Session[]>(
    `${BASE_URL}/sessions?meeting_key=${meetingKey}&session_name=Race`
  );
  return sessions[0]?.date_start ?? null;
}

export async function fetchQualifyingSession(
  meetingKey: number
): Promise<OpenF1Session | null> {
  const sessions = await fetchWithRetry<OpenF1Session[]>(
    `${BASE_URL}/sessions?meeting_key=${meetingKey}&session_name=Qualifying`
  );
  return sessions[0] ?? null;
}

export async function fetchQualifyingLaps(
  sessionKey: number
): Promise<OpenF1Lap[]> {
  return fetchWithRetry<OpenF1Lap[]>(
    `${BASE_URL}/laps?session_key=${sessionKey}`
  );
}

export async function fetchTireStints(
  sessionKey: number
): Promise<OpenF1Stint[]> {
  return fetchWithRetry<OpenF1Stint[]>(
    `${BASE_URL}/stints?session_key=${sessionKey}`
  );
}

export async function fetchSessionWeather(
  sessionKey: number
): Promise<OpenF1Weather[]> {
  return fetchWithRetry<OpenF1Weather[]>(
    `${BASE_URL}/weather?session_key=${sessionKey}`
  );
}

export async function fetchDrivers(
  sessionKey: number
): Promise<OpenF1Driver[]> {
  return fetchWithRetry<OpenF1Driver[]>(
    `${BASE_URL}/drivers?session_key=${sessionKey}`
  );
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
}

export interface DriverLapSummary {
  position: number;
  driverNumber: number;
  driverCode: string;
  driverName: string;
  team: string;
  fastestLapTime: string;
  fastestLapDuration: number;
  gapToPoleSecs: number;
  tireCompoundUsed: string;
}

export async function buildQualifyingResults(
  meetingKey: number
): Promise<DriverLapSummary[] | null> {
  const session = await fetchQualifyingSession(meetingKey);
  if (!session) return null;

  const [laps, drivers, stints] = await Promise.all([
    fetchQualifyingLaps(session.session_key),
    fetchDrivers(session.session_key),
    fetchTireStints(session.session_key),
  ]);

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Find fastest lap per driver
  const bestLaps = new Map<number, OpenF1Lap>();
  for (const lap of laps) {
    if (lap.lap_duration == null || lap.is_pit_out_lap) continue;
    const current = bestLaps.get(lap.driver_number);
    if (!current || lap.lap_duration < (current.lap_duration ?? Infinity)) {
      bestLaps.set(lap.driver_number, lap);
    }
  }

  // Find tire compound used on fastest lap for each driver
  const driverCompound = new Map<number, string>();
  for (const stint of stints) {
    const bestLap = bestLaps.get(stint.driver_number);
    if (
      bestLap &&
      bestLap.lap_number >= stint.lap_start &&
      bestLap.lap_number <= stint.lap_end
    ) {
      driverCompound.set(stint.driver_number, stint.compound);
    }
  }

  // Sort by fastest time
  const sorted = Array.from(bestLaps.entries())
    .filter(([, lap]) => lap.lap_duration != null)
    .sort((a, b) => a[1].lap_duration! - b[1].lap_duration!);

  const poleTime = sorted[0]?.[1].lap_duration ?? 0;

  return sorted.map(([driverNum, lap], index) => {
    const driver = driverMap.get(driverNum);
    return {
      position: index + 1,
      driverNumber: driverNum,
      driverCode: driver?.name_acronym ?? `D${driverNum}`,
      driverName: driver?.full_name ?? `Driver ${driverNum}`,
      team: driver?.team_name ?? "Unknown",
      fastestLapTime: formatLapTime(lap.lap_duration!),
      fastestLapDuration: lap.lap_duration!,
      gapToPoleSecs: parseFloat((lap.lap_duration! - poleTime).toFixed(3)),
      tireCompoundUsed: driverCompound.get(driverNum) ?? "UNKNOWN",
    };
  });
}

export async function fetchQualifyingWeatherSummary(
  meetingKey: number
): Promise<{
  trackTempC: number;
  airTempC: number;
  humidity: number;
  wasWet: boolean;
} | null> {
  const session = await fetchQualifyingSession(meetingKey);
  if (!session) return null;

  const weather = await fetchSessionWeather(session.session_key);
  if (weather.length === 0) return null;

  const avgTrackTemp =
    weather.reduce((s, w) => s + w.track_temperature, 0) / weather.length;
  const avgAirTemp =
    weather.reduce((s, w) => s + w.air_temperature, 0) / weather.length;
  const avgHumidity =
    weather.reduce((s, w) => s + w.humidity, 0) / weather.length;
  const wasWet = weather.some((w) => w.rainfall > 0);

  return {
    trackTempC: Math.round(avgTrackTemp * 10) / 10,
    airTempC: Math.round(avgAirTemp * 10) / 10,
    humidity: Math.round(avgHumidity),
    wasWet,
  };
}
