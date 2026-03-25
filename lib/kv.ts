import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { Briefing, BriefingMeta } from "@/types";

const BRIEFING_PREFIX = "briefing:";
const INDEX_KEY = "briefings:index";

// ---------------------------------------------------------------------------
// JSON file store for local development without Vercel KV
// ---------------------------------------------------------------------------
const DATA_DIR = join(process.cwd(), ".data");
const STORE_FILE = join(DATA_DIR, "kv.json");

function getUpstashUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
}

function getUpstashToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
}

function useLocal(): boolean {
  return !getUpstashUrl();
}

function readStore(): Record<string, unknown> {
  try {
    if (existsSync(STORE_FILE)) {
      return JSON.parse(readFileSync(STORE_FILE, "utf-8"));
    }
  } catch {
    // Corrupted file — start fresh
  }
  return {};
}

function writeStore(data: Record<string, unknown>): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

function localGet<T>(key: string): T | null {
  const store = readStore();
  return (store[key] as T) ?? null;
}

function localSet(key: string, value: unknown): void {
  const store = readStore();
  store[key] = value;
  writeStore(store);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null;
async function getKv(): Promise<any> {
  if (!redis) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: getUpstashUrl()!,
      token: getUpstashToken()!,
    });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// KV Operations
// ---------------------------------------------------------------------------

export async function storeBriefing(briefing: Briefing): Promise<void> {
  const key = `${BRIEFING_PREFIX}${briefing.slug}`;
  const meta: BriefingMeta = {
    slug: briefing.slug,
    raceName: briefing.raceName,
    location: briefing.location,
    raceDate: briefing.raceDate,
    generatedAt: briefing.generatedAt,
    headline: briefing.headline,
    summary: briefing.summary,
    keyNumber: briefing.keyNumber,
    briefingType: briefing.briefingType,
  };

  if (useLocal()) {
    localSet(key, briefing);
    const index = (localGet<BriefingMeta[]>(INDEX_KEY)) ?? [];
    const filtered = index.filter((m) => m.slug !== briefing.slug);
    filtered.push(meta);
    filtered.sort(
      (a, b) =>
        new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime()
    );
    localSet(INDEX_KEY, filtered);
    return;
  }

  const kv = await getKv();
  await kv.set(key, briefing);
  await kv.zadd(INDEX_KEY, {
    score: new Date(briefing.raceDate).getTime(),
    member: JSON.stringify(meta),
  });
}

export async function getBriefing(slug: string): Promise<Briefing | null> {
  const key = `${BRIEFING_PREFIX}${slug}`;

  if (useLocal()) {
    return localGet<Briefing>(key);
  }

  const kv = await getKv();
  return (await kv.get(key)) as Briefing | null;
}

export async function getAllBriefings(): Promise<BriefingMeta[]> {
  if (useLocal()) {
    return localGet<BriefingMeta[]>(INDEX_KEY) ?? [];
  }

  const kv = await getKv();
  const members = await kv.zrange(INDEX_KEY, 0, -1, { rev: true });
  if (!Array.isArray(members)) return [];

  return members.map((m: string | BriefingMeta) =>
    typeof m === "string" ? (JSON.parse(m) as BriefingMeta) : m
  );
}

export async function getLatestBriefing(): Promise<Briefing | null> {
  const all = await getAllBriefings();
  if (all.length === 0) return null;
  return getBriefing(all[0].slug);
}

// ---------------------------------------------------------------------------
// Raw API response caching (1hr TTL)
// ---------------------------------------------------------------------------

export async function getCachedApiResponse<T>(key: string): Promise<T | null> {
  const cacheKey = `api-cache:${key}`;

  if (useLocal()) {
    const entry = localGet<{ data: T; expiresAt: number }>(cacheKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      // Expired — remove it
      const store = readStore();
      delete store[cacheKey];
      writeStore(store);
      return null;
    }
    return entry.data;
  }

  const kv = await getKv();
  return (await kv.get(cacheKey)) as T | null;
}

export async function setCachedApiResponse<T>(
  key: string,
  data: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const cacheKey = `api-cache:${key}`;

  if (useLocal()) {
    localSet(cacheKey, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return;
  }

  const kv = await getKv();
  await kv.set(cacheKey, data, { ex: ttlSeconds });
}
