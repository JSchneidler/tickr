import { beforeAll, afterAll, beforeEach } from "bun:test";
import { buildApp } from "../src/app";
import db from "../src/db";

type App = Awaited<ReturnType<typeof buildApp>>;

let app: App;

export async function getApp(): Promise<App> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export function setupTestLifecycle() {
  beforeAll(async () => {
    try {
      await getApp();
    } catch (err) {
      console.error("Failed to build test app:", err);
      throw err;
    }
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await app.close();
  });
}

export async function cleanup() {
  const tables = ["Order", "Holding", "AccessToken", "AdminAction", "User", "Coin"];
  for (const table of tables) await db.$executeRawUnsafe(`DELETE FROM "${table}"`);
}

export async function registerUser(
  overrides?: Partial<{ email: string; name: string; password: string }>,
) {
  const app = await getApp();
  const payload = {
    email: "test@test.com",
    name: "Test User",
    password: "testpassword123",
    ...overrides,
  };

  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload,
  });

  return { res, payload };
}

export async function loginUser(email: string, password: string) {
  const app = await getApp();
  return app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
}

export function getAuthCookie(res: { cookies: { name: string; value: string }[] }) {
  const cookie = res.cookies.find((c) => c.name === "token");
  return cookie?.value ?? "";
}

export async function seedCoin(
  overrides?: Partial<{
    externalId: string;
    imageUrl: string;
    name: string;
    displayName: string;
    description: string;
  }>,
) {
  return db.coin.create({
    data: {
      externalId: "bitcoin",
      imageUrl: "https://example.com/btc.png",
      name: "BTC",
      displayName: "Bitcoin",
      description: "Test Bitcoin",
      ...overrides,
    },
  });
}
