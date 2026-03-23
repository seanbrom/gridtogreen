import { fetchWithRetry } from "./fetch-utils";
import type { DriverOdds, H2HMarket } from "@/types";

const BASE_URL = "https://gamma-api.polymarket.com";

// Map last names to 3-letter driver codes
const DRIVER_CODES: Record<string, string> = {
  verstappen: "VER",
  norris: "NOR",
  leclerc: "LEC",
  piastri: "PIA",
  hamilton: "HAM",
  russell: "RUS",
  sainz: "SAI",
  alonso: "ALO",
  stroll: "STR",
  gasly: "GAS",
  ocon: "OCO",
  tsunoda: "TSU",
  ricciardo: "RIC",
  bottas: "BOT",
  zhou: "ZHO",
  magnussen: "MAG",
  hulkenberg: "HUL",
  albon: "ALB",
  bearman: "BEA",
  lawson: "LAW",
  colapinto: "COL",
  antonelli: "ANT",
  hadjar: "HAD",
  doohan: "DOO",
  bortoleto: "BOR",
  lindblad: "LIN",
  perez: "PER",
};

// Polymarket event structure: one event with many binary "Will X win?" markets
interface PolymarketEventMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string | string[];
  outcomePrices: string | string[];
  liquidity: string;
  volume: string;
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  liquidity: number;
  volume: number;
  markets: PolymarketEventMarket[];
}

/**
 * Build the event slug Polymarket uses for F1 race winner markets.
 * Pattern: f1-{race-name-slug}-winner-{YYYY-MM-DD}
 * e.g. "Japanese Grand Prix" + "2026-03-29" → "f1-japanese-grand-prix-winner-2026-03-29"
 *
 * Note: raceDate should be the actual race day (Sunday), not the meeting start (Friday).
 */
function buildEventSlug(raceName: string, raceDate: string): string {
  const dateStr = raceDate.split("T")[0];
  const nameSlug = raceName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");
  return `f1-${nameSlug}-winner-${dateStr}`;
}

/**
 * Extract driver name from a "Will X win the 2026 F1 ... ?" question.
 */
function extractDriverName(question: string): string {
  const match = question.match(/^Will (.+?) win the/i);
  if (!match) return question;
  return match[1].trim();
}

function lookupDriverCode(fullName: string): string {
  const parts = fullName.toLowerCase().split(/\s+/);
  // Try matching each word against known last names
  for (const part of [...parts].reverse()) {
    const cleaned = part.replace(/[^a-z]/g, "");
    if (DRIVER_CODES[cleaned]) return DRIVER_CODES[cleaned];
  }
  // Fallback: first 3 letters of last word
  const lastName = parts[parts.length - 1] ?? fullName;
  return lastName.substring(0, 3).toUpperCase();
}

/**
 * Safely parse outcomePrices which can be a JSON string or already an array.
 */
function parsePrices(raw: string | string[]): number[] {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((v: string | number) => parseFloat(String(v)));
  } catch {
    return [];
  }
}

/**
 * Fetch the race winner event from Polymarket by constructing the event slug.
 */
async function fetchRaceWinnerEvent(
  raceName: string,
  raceDate: string
): Promise<PolymarketEvent | null> {
  const slug = buildEventSlug(raceName, raceDate);

  try {
    const events = await fetchWithRetry<PolymarketEvent[]>(
      `${BASE_URL}/events?slug=${slug}`
    );

    if (Array.isArray(events) && events.length > 0) {
      return events[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse individual driver markets from an event into sorted DriverOdds[].
 * Each market is binary ("Will X win?") — the "Yes" price = implied probability.
 */
function parseDriverOddsFromEvent(event: PolymarketEvent): DriverOdds[] {
  return event.markets
    .map((market) => {
      // Skip "other driver" catch-all markets
      if (market.slug.includes("-other-")) return null;

      // Validate this is actually an F1 driver winner market
      if (!market.question.toLowerCase().includes("win the")) return null;

      const driverName = extractDriverName(market.question);
      const driverCode = lookupDriverCode(driverName);

      const prices = parsePrices(market.outcomePrices);
      const yesPrice = prices[0] ?? 0;

      if (yesPrice <= 0 || isNaN(yesPrice)) return null;

      return {
        driverName,
        driverCode,
        impliedProbability: yesPrice,
        price: yesPrice,
      };
    })
    .filter((d): d is DriverOdds => d !== null)
    .sort((a, b) => b.impliedProbability - a.impliedProbability);
}

/**
 * Fetch all F1 race odds for a given race.
 */
export async function fetchAllRaceOdds(
  raceName: string,
  raceDate?: string
): Promise<{
  raceWinner: DriverOdds[];
  headToHeads: H2HMarket[];
}> {
  if (!raceDate) {
    return { raceWinner: [], headToHeads: [] };
  }

  const event = await fetchRaceWinnerEvent(raceName, raceDate);

  if (!event) {
    return { raceWinner: [], headToHeads: [] };
  }

  return {
    raceWinner: parseDriverOddsFromEvent(event),
    headToHeads: [],
  };
}
