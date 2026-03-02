import tradeEngine from "./tradeEngine";
import tradeFeed from "./apis/tradeFeed";
import type { WebsocketHandler } from "@fastify/websocket";

import logger from "./logger";
import { WebSocketMessageType } from "@tickr/shared";

const websocketHandler: WebsocketHandler = (socket, req) => {
  if (req.user) {
    logger.info(`User connected: ${req.user.name}(${req.user.id.toString()})`);

    tradeEngine.addLiveUser(req.user.id, (order) => {
      socket.send(
        JSON.stringify({
          type: WebSocketMessageType.ORDER_FILLED,
          payload: order,
        }),
      );
    });
  } else logger.info(`Guest connected: ${req.ip}`);

  const interval = setInterval(() => {
    socket.send(
      JSON.stringify({
        type: WebSocketMessageType.WATCH,
        payload: tradeFeed.getLastPrices(),
      }),
    );
  }, 1000);

  socket.on("error", (error) => {
    logger.error(error);
  });

  socket.on("close", () => {
    if (req.user) {
      logger.info(
        `User disconnected: ${req.user.name}(${req.user.id.toString()})`,
      );
      tradeEngine.removeLiveUser(req.user.id);
    } else logger.info(`Guest disconnected: ${req.ip}`);

    clearInterval(interval);
  });
};

export default websocketHandler;
