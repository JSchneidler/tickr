import { FastifyInstance } from "fastify";

import authRoutes from "./auth/auth.routes";
import meRoutes from "./user/me.routes";
import userRoutes from "./user/user.routes";
import coinRoutes from "./coin/coin.routes";
import tokenRoutes from "./token/token.routes";
import holdingRoutes from "./holding/holding.routes";
import orderRoutes from "./order/order.routes";
// import adminRoutes from "./admin/admin.routes";
import websocketHandler from "./websocketHandler";

export default function (f: FastifyInstance) {
  f.get("/ws", { websocket: true }, websocketHandler);

  f.register(authRoutes, { prefix: "/auth" });
  f.register(meRoutes, { prefix: "/me" });
  f.register(userRoutes, { prefix: "/users" });
  // f.register(adminRoutes, { prefix: "/admin" });
  f.register(coinRoutes, { prefix: "/coins" });
  f.register(tokenRoutes, { prefix: "/tokens" });
  f.register(holdingRoutes, { prefix: "/holdings" });
  f.register(orderRoutes, { prefix: "/orders" });
}
