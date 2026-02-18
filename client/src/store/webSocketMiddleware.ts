import { Middleware, isAnyOf } from "@reduxjs/toolkit";
import { notifications } from "@mantine/notifications";

import { RootState } from ".";
import { WebSocketClient, WebSocketMessageType } from "../webSocketClient";
import { api } from "./api";
import { pricesUpdated } from "./livePrices";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const webSocketMiddleware: Middleware<{}, RootState> = (store) => {
  const webSocketClient = new WebSocketClient();

  webSocketClient.socket.addEventListener("open", () => {
    attachListeners();
  });

  function attachListeners() {
    webSocketClient.listen(WebSocketMessageType.WATCH, (prices) => {
      store.dispatch(pricesUpdated(prices));
    });

    webSocketClient.listen(WebSocketMessageType.ORDER_FILLED, (order) => {
      const { data: coin } = api.endpoints.getCoin.select(order.coinId)(
        // TODO: What if coin is not cached?
        store.getState(),
      );

      // Shares or price must exist
      const quantity = order.shares
        ? `${order.shares} shares`
        : `$${order.price!}`; // eslint-disable-line @typescript-eslint/no-non-null-assertion

      if (coin && order.sharePrice)
        notifications.show({
          title: "Order filled",
          message: `${order.direction}@${order.sharePrice} ${quantity} of ${coin.name}`,
        });

      store.dispatch(api.util.invalidateTags(["User", "Holding", "Order"]));
    });
  }

  return (next) => (action) => {
    if (
      isAnyOf(
        api.endpoints.register.matchFulfilled,
        api.endpoints.login.matchFulfilled,
        api.endpoints.logout.matchFulfilled,
      )(action)
    ) {
      webSocketClient.disconnect();
      webSocketClient.connect();
      webSocketClient.socket.addEventListener("open", () => {
        attachListeners();
      });
    }

    return next(action);
  };
};
