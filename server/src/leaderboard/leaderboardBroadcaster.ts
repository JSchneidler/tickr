import type { WebSocket } from "ws";
import { WebSocketMessageType } from "@tickr/shared";

import logger from "../logger";
import { computeLeaderboard } from "./leaderboard.service";

const BROADCAST_INTERVAL = 5000;
const WS_OPEN = 1;

class LeaderboardBroadcaster {
  private clients = new Set<WebSocket>();
  private interval: Timer | null = null;

  start() {
    this.interval = setInterval(() => {
      void this.broadcast();
    }, BROADCAST_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  addClient(socket: WebSocket) {
    this.clients.add(socket);
  }

  removeClient(socket: WebSocket) {
    this.clients.delete(socket);
  }

  private async broadcast() {
    if (this.clients.size === 0) return;

    try {
      const leaderboard = await computeLeaderboard();
      const message = JSON.stringify({
        type: WebSocketMessageType.LEADERBOARD,
        payload: leaderboard,
      });

      for (const client of this.clients) {
        if (client.readyState === WS_OPEN) {
          client.send(message);
        }
      }
    } catch (err) {
      logger.error(err, "Failed to broadcast leaderboard");
    }
  }
}

export default new LeaderboardBroadcaster();
