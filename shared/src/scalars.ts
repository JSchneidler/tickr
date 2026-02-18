import { Unsafe } from "@sinclair/typebox";

export const Decimal = Unsafe<string>({
  type: "string",
});
export const NullableDecimal = Unsafe<string | null>({
  type: ["string", "null"],
});

export const DateTime = Unsafe<string>({
  type: "string",
});
export const NullableDateTime = Unsafe<string | null>({
  type: ["string", "null"],
});
