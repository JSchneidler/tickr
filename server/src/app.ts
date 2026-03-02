import fastify from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

import jwtAuth from "./auth";
import api from "./api";
import env from "./env";
import logger from "./logger";

export async function buildApp() {
  const f = fastify({
    loggerInstance: logger,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await f.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Tickr API",
        description: "Tickr API",
        version: "0.0.1",
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

  return f;
}
