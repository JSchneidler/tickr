export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export type LoginRequest = Omit<RegisterRequest, "name">;

export interface User {
  id: number;
  name: string;
  email: string;
  balance: string;
  deposits: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Coin {
  id: number;
  externalId: string;
  name: string;
  displayName: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CoinWithQuote extends Coin {
  currentPrice: string;
  dayHigh: string;
  dayLow: string;
  change: string;
  changePercent: string;
}

export interface CoinHistoricalDataRequest {
  coinId: number;
  daysAgo: number;
}

type HistoricalData = [number, string][];
export interface CoinHistoricalData {
  prices: HistoricalData;
  marketCaps: HistoricalData;
  totalVolumes: HistoricalData;
}

export interface Holding {
  id: number;
  userId: number;
  coinId: number;
  shares: string;
  cost: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export enum OrderDirection {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT",
}

export interface Order {
  id: number;
  userId: number;
  coinId: number;
  direction: OrderDirection;
  type: OrderType;
  shares?: string;
  price?: string;
  filled: boolean;
  sharePrice?: string;
  totalPrice?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateOrder = Pick<
  Order,
  "coinId" | "direction" | "type" | "shares" | "price"
>;

export type UpdateOrder = Omit<CreateOrder, "coinId">;
