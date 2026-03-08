import {
  WebSocketMessageType,
  type PriceUpdate,
  type LeaderboardEntry,
  type WebSocketMessage,
  type OrderResponse,
} from "@tickr/shared";

export { WebSocketMessageType, type PriceUpdate, type LeaderboardEntry };

interface PayloadMap {
  [WebSocketMessageType.ORDER_FILLED]: OrderResponse;
  [WebSocketMessageType.WATCH]: PriceUpdate[];
  [WebSocketMessageType.LEADERBOARD]: LeaderboardEntry[];
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
