import { type OrderResponse } from "./order";

export enum WebSocketMessageType {
  ORDER_FILLED = "ORDER_FILLED",
  WATCH = "WATCH",
}

export interface PriceUpdate {
  coinId: number;
  price: string;
}

interface PayloadMap {
  [WebSocketMessageType.ORDER_FILLED]: OrderResponse;
  [WebSocketMessageType.WATCH]: PriceUpdate[];
}

export interface WebSocketMessage<T extends WebSocketMessageType> {
  type: T;
  payload: PayloadMap[T];
}
