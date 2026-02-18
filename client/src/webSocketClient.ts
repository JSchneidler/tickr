import { Order } from "./store/api/schema";

export enum WebSocketMessageType {
  ORDER_FILLED = "ORDER_FILLED",
  WATCH = "WATCH",
}

export interface PriceUpdate {
  coinId: number;
  price: string;
}

interface PayloadMap {
  [WebSocketMessageType.ORDER_FILLED]: Order;
  [WebSocketMessageType.WATCH]: PriceUpdate[];
}

export interface WebSocketMessage<T extends WebSocketMessageType> {
  type: T;
  payload: PayloadMap[T];
}

type MessageListener<T extends WebSocketMessageType> = (
  payload: PayloadMap[T],
) => void;

const BASE_URL = `${window.location.hostname}:3000`;

export class WebSocketClient {
  private _socket: WebSocket = new WebSocket(`ws://${BASE_URL}/api/ws`);

  public get socket() {
    return this._socket;
  }

  connect() {
    if (this._socket.readyState !== WebSocket.CLOSED) return;

    this._socket = new WebSocket(`ws://${BASE_URL}/api/ws`);
    this._socket.onopen = () => {
      console.log("Connected to WebSocket");
    };
  }

  disconnect() {
    this._socket.close();
  }

  listen<T extends WebSocketMessageType>(
    type: T,
    listener: MessageListener<T>,
  ) {
    if (this._socket.readyState !== WebSocket.OPEN)
      throw new Error("Not connected to WebSocket");

    const internalListener = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as WebSocketMessage<T>;

      if (message.type === type) listener(message.payload);
    };

    this._socket.addEventListener("message", internalListener);
    return () => {
      this._socket.removeEventListener("message", internalListener);
    };
  }
}
