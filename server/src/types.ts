import { Unsafe } from "@sinclair/typebox";
import { Prisma } from "./generated/prisma/client";

export const Decimal = Unsafe<Prisma.Decimal>({
  type: "string",
});
export const NullableDecimal = Unsafe<Prisma.Decimal | null>({
  type: ["string", "null"],
});

export const DateTime = Unsafe<Date>({
  type: "string",
});
export const NullableDateTime = Unsafe<Date | null>({
  type: ["string", "null"],
});
