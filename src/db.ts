import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
});

export default new PrismaClient({
  adapter,
  omit: {
    user: {
      password_hash: true,
      salt: true,
    },
    accessToken: {
      token_hash: true,
    },
  },
});
