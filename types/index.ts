// ============================================================
// OpenF1 API Types (flat structures from api.openf1.org/v1)
// ============================================================

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  year: number;
}

export interface OpenF1Session {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  gmt_offset: string;
  year: number;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
  sector_1_duration: number | null;
  sector_2_duration: number | null;
  sector_3_duration: number | null;
  date_start: string;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Weather {
  air_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
  date: string;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  session_key: number;
  meeting_key: number;
}

// ============================================================
// Jolpica/Ergast API Types (parsed from nested Ergast format)
// ============================================================

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  constructorName: string;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  constructorName: string;
}

export interface CircuitInfo {
  circuitId: string;
  circuitName: string;
  lat: number;
  lng: number;
  locality: string;
  country: string;
}

export interface HistoricalRaceResult {
  season: number;
  round: number;
  raceName: string;
  position: number;
  grid: number;
  driverCode: string;
  driverName: string;
  constructorName: string;
  laps: number;
  status: string;
  time: string | null;
  fastestLapTime: string | null;
}

// ============================================================
// Polymarket Types
// ============================================================

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
  startDate: string;
  endDate: string;
  closed: boolean;
  active: boolean;
}

export interface DriverOdds {
  driverName: string;
  driverCode: string;
  impliedProbability: number;
  price: number;
}

export interface H2HMarket {
  question: string;
  driver1: string;
  driver2: string;
  driver1Probability: number;
}

// ============================================================
// Weather Types
// ============================================================

export interface WeatherForecast {
  conditionSummary: string;
  maxTempC: number;
  precipitationProbability: number;
  windSpeedKmh: number;
}

// ============================================================
// Briefing Context (assembled for Claude)
// ============================================================

export interface BriefingContext {
  race: {
    name: string;
    slug: string;
    circuit: string;
    location: string;
    raceDate: string;
    laps: number;
    circuitLengthKm: number;
  };
  qualifying: {
    results: Array<{
      position: number;
      driverCode: string;
      driverName: string;
      team: string;
      fastestLapTime: string;
      gapToPoleSecs: number;
      q1Time?: string;
      q2Time?: string;
      q3Time?: string;
      tireCompoundUsed: string;
    }>;
    sessionConditions: {
      trackTempC: number;
      airTempC: number;
      humidity: number;
      wasWet: boolean;
    };
  };
  odds: {
    raceWinner: DriverOdds[];
    headToHeads: H2HMarket[];
  };
  circuitHistory: {
    recentWinners: Array<{
      year: number;
      winner: string;
      team: string;
      startingPosition: number;
      fastestLap: string;
      safetyCars: number | null;
    }>;
    dominantTeams: string[];
    averageLeadChanges: number | null;
    safetyCarFrequency: string;
  };
  standings: {
    drivers: Array<{
      position: number;
      driverName: string;
      driverCode: string;
      team: string;
      points: number;
    }>;
    constructors: Array<{
      position: number;
      team: string;
      points: number;
    }>;
  };
  weather: {
    raceDayForecast: WeatherForecast;
  };
}

// ============================================================
// Polymarket Price History Types
// ============================================================

export interface PricePoint {
  t: number; // unix timestamp
  p: number; // price (0-1 probability)
}

export interface DriverPriceHistory {
  driverName: string;
  driverCode: string;
  currentProbability: number;
  history: PricePoint[];
}

// ============================================================
// Generated Briefing (Claude output)
// ============================================================

export interface GeneratedBriefing {
  sections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  headline: string;
  summary: string;
  keyNumber: {
    value: string;
    label: string;
  };
}

// ============================================================
// Stored Briefing (KV)
// ============================================================

export interface Briefing {
  slug: string;
  raceName: string;
  circuit: string;
  location: string;
  country: string;
  raceDate: string;
  generatedAt: string;
  headline: string;
  summary: string;
  keyNumber: {
    value: string;
    label: string;
  };
  sections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  odds: {
    raceWinner: DriverOdds[];
    headToHeads: H2HMarket[];
  };
  qualifying: BriefingContext["qualifying"];
  weather: BriefingContext["weather"] | null;
  polymarketSlug?: string;
  briefingType?: "preview" | "full";
}

export interface BriefingMeta {
  slug: string;
  raceName: string;
  location: string;
  raceDate: string;
  generatedAt: string;
  headline: string;
  summary: string;
  keyNumber: {
    value: string;
    label: string;
  };
  briefingType?: "preview" | "full";
}
