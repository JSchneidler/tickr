import fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyGracefulShutdown from "fastify-graceful-shutdown";

import tradeFeed from "./apis/tradeFeed";
import tradeEngine from "./tradeEngine";
import jwtAuth from "./auth";
import api from "./api";
import env from "./env";
import logger from "./logger";

const start = async () => {
  const f = fastify({ loggerInstance: logger }).withTypeProvider<TypeBoxTypeProvider>();
  try {
    await tradeFeed.start();
    await tradeEngine.start();

    await f.register(fastifyGracefulShutdown);

    f.after(() => {
      f.gracefulShutdown((signal) => {
        f.log.info(`Shutting down: ${signal}`);
        tradeFeed.stop();
      });
    });

    await f.register(fastifySwagger, {
      openapi: {
        openapi: "3.1.0",
        info: {
          title: "Tickr API",
          description: "Tickr API",
          version: "0.0.0",
        },
      },
    });

    await f.register(fastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
      staticCSP: true,
    });

    await f.register(fastifyCookie, {
      secret: env.JWT_SECRET,
    });
    await f.register(jwtAuth);

    await f.register(fastifyWebsocket);
    await f.register(fastifyCors, {
      origin: [
        "http://localhost:5173",
        /^http:\/\/.*\.?tickr\.jschneidler\.com$/,
        /^https:\/\/.*\.?tickr\.jschneidler\.com$/,
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "debug"],
    });

    await f.register(api, { prefix: "/api" });

    await f.ready();

    const address = await f.listen({ host: "0.0.0.0", port: 3000 });
    f.log.info(`Server listening on ${address}`);
  } catch (err) {
    f.log.error(err);
    process.exit(1);
  }
};

void start();
