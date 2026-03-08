import { type OrderResponse } from "./order";

export enum WebSocketMessageType {
  ORDER_FILLED = "ORDER_FILLED",
  WATCH = "WATCH",
  LEADERBOARD = "LEADERBOARD",
}

export interface PriceUpdate {
  coinId: number;
  price: string;
}

export interface LeaderboardEntry {
  userId: number;
  name: string;
  portfolioValue: string;
  rank: number;
}

interface PayloadMap {
  [WebSocketMessageType.ORDER_FILLED]: OrderResponse;
  [WebSocketMessageType.WATCH]: PriceUpdate[];
  [WebSocketMessageType.LEADERBOARD]: LeaderboardEntry[];
}

export interface WebSocketMessage<T extends WebSocketMessageType> {
  type: T;
  payload: PayloadMap[T];
}
