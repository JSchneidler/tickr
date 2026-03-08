import { describe, it, expect } from "bun:test";
import {
  setupTestLifecycle,
  getApp,
  registerUser,
  loginUser,
  getAuthCookie,
  seedCoin,
} from "./setup";

setupTestLifecycle();

describe("auth", () => {
  it("registers a new user", async () => {
    const { res } = await registerUser();
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.email).toBe("test@test.com");
    expect(body.name).toBe("Test User");
    expect(body.balance).toBeDefined();
  });

  it("sets auth cookie on register", async () => {
    const { res } = await registerUser();
    const cookie = getAuthCookie(res);
    expect(cookie).not.toBe("");
  });

  it("logs in with correct credentials", async () => {
    await registerUser();
    const res = await loginUser("test@test.com", "testpassword123");
    expect(res.statusCode).toBe(200);

    const cookie = getAuthCookie(res);
    expect(cookie).not.toBe("");
  });

  it("rejects login with wrong password", async () => {
    await registerUser();
    const res = await loginUser("test@test.com", "wrongpassword123");
    expect(res.statusCode).toBe(401);
  });

  it("accesses protected route with auth", async () => {
    const { res: registerRes } = await registerUser();
    const cookie = getAuthCookie(registerRes);

    const app = await getApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/me",
      cookies: { token: cookie },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe("test@test.com");
  });

  it("rejects protected route without auth", async () => {
    const app = await getApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/me",
    });

    expect(res.statusCode).toBe(401);
  });

  it("logs out", async () => {
    const { res: registerRes } = await registerUser();
    const cookie = getAuthCookie(registerRes);

    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      cookies: { token: cookie },
    });

    expect(res.statusCode).toBe(200);
  });
});

describe("orders", () => {
  it("creates a BUY MARKET order", async () => {
    const { res: registerRes } = await registerUser();
    const cookie = getAuthCookie(registerRes);
    const coin = await seedCoin();

    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      cookies: { token: cookie },
      payload: {
        coinId: coin.id,
        shares: "1",
        direction: "BUY",
        type: "MARKET",
      },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.direction).toBe("BUY");
    expect(body.type).toBe("MARKET");
    expect(body.coinId).toBe(coin.id);
    expect(body.filled).toBe(false);
  });

  it("rejects order without auth", async () => {
    const coin = await seedCoin();

    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {
        coinId: coin.id,
        shares: "1",
        direction: "BUY",
        type: "MARKET",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects order without shares or price", async () => {
    const { res: registerRes } = await registerUser();
    const cookie = getAuthCookie(registerRes);
    const coin = await seedCoin();

    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      cookies: { token: cookie },
      payload: {
        coinId: coin.id,
        direction: "BUY",
        type: "MARKET",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("creates a SELL LIMIT order when holding exists", async () => {
    const { res: registerRes } = await registerUser();
    const cookie = getAuthCookie(registerRes);
    const coin = await seedCoin();

    // Seed a holding so the user has shares to sell
    const user = registerRes.json();
    const db = (await import("../src/db")).default;
    await db.holding.create({
      data: {
        shares: 10,
        cost: 500000,
        coinId: coin.id,
        userId: user.id,
      },
    });

    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      cookies: { token: cookie },
      payload: {
        coinId: coin.id,
        shares: "5",
        cost: "55000",
        direction: "SELL",
        type: "LIMIT",
      },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.direction).toBe("SELL");
    expect(body.type).toBe("LIMIT");
  });
});
