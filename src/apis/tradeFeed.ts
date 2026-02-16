import { Prisma } from "../generated/prisma/client";

import env from "../env";
import { getCoins } from "../coin/coin.service";
import { CoinResponse } from "../coin/coin.schema";
import logger from "../logger";

interface Trade {
  c: number[] | undefined; // Trade conditions
  p: number; // Last price
  s: string; // Coin
  t: string; // UNIX Timetamp (ms)
  v: string; // Volume
}

interface SocketMessage {
  data: unknown;
  type: "trade" | "";
}

interface TradesMessage extends SocketMessage {
  type: "trade";
  data: Trade[];
}

type TradeListener = (summary: TradesSummary) => void | Promise<void>;
export type UnSubFn = () => void;

export interface TradesSummary {
  last: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
}

interface LivePrice {
  coinId: number;
  price: string;
}

const FINNHUB_WEBSOCKET_URL = "wss://ws.finnhub.io/";
const URL = `${FINNHUB_WEBSOCKET_URL}?token=${env.FINNHUB_API_KEY}`;

const PUBLISH_INTERVAL = 1000; // Remove interval, publish immediately somehow

class TradeFeed {
  private ws!: WebSocket;
  private publishInterval!: Timer;

  private coins: CoinResponse[] = [];
  private subscriptions = new Map<string, TradeListener[]>();
  private tradesSummaries = new Map<string, TradesSummary>();

  async start() {
    this.coins = await getCoins();
    this.ws = new WebSocket(URL);

    await this.waitForConnection();

    this.ws.addEventListener("message", (event: MessageEvent<string>) => {
      this.handleMessage(event);
    });

    this.startSubscriptions();

    this.publishInterval = setInterval(() => {
      void this.publish();
    }, PUBLISH_INTERVAL);
  }

  stop() {
    clearInterval(this.publishInterval);
    this.ws.close();
  }

  getLastPrices(): LivePrice[] {
    const last = [];
    for (const coin of this.coins) {
      const summary = this.tradesSummaries.get(coin.name);
      if (summary)
        last.push({
          coinId: coin.id,
          price: summary.last.toString(),
        });
    }

    return last;
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stop();
        reject(
          new Error("Connection to Finnhub WSS timed out after 10 seconds"),
        );
      }, 10000);

      this.ws.addEventListener("open", () => {
        clearTimeout(timeout);
        logger.info("Connected to Finnhub WSS");
        resolve();
      });

      this.ws.addEventListener("error", () => {
        clearTimeout(timeout);
        logger.error("Error occurred in Finnhub WSS");
        reject(new Error("Error occurred in Finnhub WSS"));
      });
    });
  }

  private handleMessage(event: MessageEvent<string>) {
    const response = JSON.parse(event.data) as SocketMessage;
    if (response.type !== "trade") return;

    const tradesMessage = response as TradesMessage;
    for (const trade of tradesMessage.data) {
      const coin = fromSubscriptionFormat(trade.s);
      const price = new Prisma.Decimal(trade.p);

      const summary = this.tradesSummaries.get(coin);
      if (summary) {
        summary.last = price;
        if (summary.low.greaterThan(trade.p)) summary.low = price;
        else if (summary.high.lessThan(trade.p)) summary.high = price;
      } else {
        this.tradesSummaries.set(coin, {
          last: price,
          high: price,
          low: price,
        });
      }
    }
  }

  private startSubscriptions() {
    for (const coin of this.coins)
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          symbol: toSubscriptionFormat(coin.name),
        }),
      );
  }

  private async publish() {
    for (const [coin, summary] of this.tradesSummaries) {
      const listeners = this.subscriptions.get(coin);
      if (listeners) for (const listener of listeners) await listener(summary);
    }

    this.tradesSummaries.forEach((summary) => {
      summary.high = summary.last;
      summary.low = summary.last;
    });
  }

  subscribe(coin: string, listener: TradeListener): UnSubFn {
    const listeners = this.subscriptions.get(coin);

    if (listeners) listeners.push(listener);
    else this.subscriptions.set(coin, [listener]);

    return () => {
      this.unsubscribe(coin, listener);
    };
  }

  private unsubscribe(coin: string, listener: TradeListener) {
    const listeners = this.subscriptions.get(coin);
    if (listeners)
      this.subscriptions.set(
        coin,
        listeners.filter((l) => listener !== l),
      );
  }
}

const PREFIX = "BINANCE:";
const SUFFIX = "USDT";

function toSubscriptionFormat(coinName: string) {
  return `BINANCE:${coinName}USDT`;
}

function fromSubscriptionFormat(symbol: string) {
  return symbol.slice(PREFIX.length, SUFFIX.length * -1);
}

export default new TradeFeed();
