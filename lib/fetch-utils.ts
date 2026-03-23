const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_RETRIES = 1;

export async function fetchWithRetry<T>(
  url: string,
  options?: {
    maxRetries?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: options?.headers,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
