import { Prisma } from "../generated/prisma/client";
import { Object as TObj, type Static } from "@sinclair/typebox";

import { tokenId } from "@tickr/shared";

// Prisma
export type TokenWithoutSensitive = Prisma.AccessTokenGetPayload<{
  omit: { token_hash: true };
}>;

export interface CreateToken {
  accessToken: TokenWithoutSensitive;
  token: string;
}

// API
export const getTokenParams = TObj({
  tokenId,
});
export type GetTokenParams = Static<typeof getTokenParams>;
