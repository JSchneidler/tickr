import type {
  FastifyInstance,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify";
import FastifyPlugin from "fastify-plugin";
import fastifyJwt, { type JWT } from "@fastify/jwt";
import { createSigner } from "fast-jwt";

import env from "../env";
import type { UserWithoutSensitive } from "../user/user.schema";
import { getUser } from "../user/user.service";

declare module "fastify" {
  interface FastifyRequest {
    jwt?: JWT;
    user: UserWithoutSensitive | undefined;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: UserWithoutSensitive | undefined;
  }
}

const signJwt = createSigner({
  algorithm: "HS256",
  key: async () => Promise.resolve(env.JWT_SECRET),
  expiresIn: "7d",
});

export async function hashPassword(password: string) {
  const hash = await Bun.password.hash(password, "bcrypt");
  return Buffer.from(hash);
}

export async function comparePasswordHash(password: Buffer, hash: Buffer) {
  return await Bun.password.verify(password, hash.toString());
}

export async function generateJwt(user: UserWithoutSensitive) {
  const token = await signJwt({
    id: user.id,
  });
  return {
    token,
    hash: new Uint8Array(new Bun.CryptoHasher("sha256").update(token).digest()),
  };
}

export function getAuthUser(req: FastifyRequest): UserWithoutSensitive {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

function httpError(statusCode: number, message: string) {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// TODO: Remove eslint-disable?
// eslint-disable-next-line @typescript-eslint/require-await
export async function authenticate<T extends RouteGenericInterface>(
  req: FastifyRequest<T>,
) {
  if (!req.user) throw httpError(401, "Unauthorized");
}

// TODO: Remove eslint-disable?
// eslint-disable-next-line @typescript-eslint/require-await
export async function requireAdmin<T extends RouteGenericInterface>(
  req: FastifyRequest<T>,
) {
  if (!req.user) throw httpError(401, "Unauthorized");
  if (req.user.role !== "ADMIN") throw httpError(403, "Forbidden");
}

export default FastifyPlugin(async (f: FastifyInstance) => {
  await f.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "token",
      signed: true,
    },
  });

  f.addHook("onRequest", async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
      if (req.user) req.user = await getUser(req.user.id);
    } catch (err) {
      f.log.error(err);
    }
  });
});
