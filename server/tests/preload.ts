// Set test environment variables before any modules load
process.env.DATABASE_URL = "file:test.db";
process.env.JWT_SECRET = "tickr-testing-jwt";
process.env.COINGECKO_API_KEY = "test-key";
process.env.FINNHUB_API_KEY = "test-key";

// Mock fetch to intercept CoinGecko API calls
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (
  input: string | URL | Request,
  init?: RequestInit,
) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (url.includes("coingecko.com")) {
    if (url.includes("/simple/price")) {
      // Extract coin ID from query string (ids=bitcoin)
      const match = url.match(/ids=([^&]+)/);
      const coinId = match?.[1] ?? "bitcoin";
      return new Response(JSON.stringify({ [coinId]: { usd: 50000 } }));
    }
    if (url.includes("/ohlc")) {
      return new Response(
        JSON.stringify([[Date.now(), 49000, 51000, 48000, 49500]]),
      );
    }
    if (url.includes("/market_chart")) {
      return new Response(
        JSON.stringify({ prices: [], market_caps: [], total_volumes: [] }),
      );
    }
    // Fallback for any other CoinGecko endpoint
    return new Response(JSON.stringify({}));
  }

  return originalFetch(input, init);
} as typeof fetch;
