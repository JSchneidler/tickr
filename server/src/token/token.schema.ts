import { Prisma } from "../generated/prisma/client";
import {
  Object as TObj,
  String as TStr,
  Number as TNum,
  Array as TArr,
  type Static,
} from "@sinclair/typebox";

import { userId } from "../user/user.schema";
import { DateTime, NullableDateTime } from "../types";

// Prisma
export type TokenWithoutSensitive = Prisma.AccessTokenGetPayload<{
  omit: { token_hash: true };
}>;

export interface CreateToken {
  accessToken: TokenWithoutSensitive;
  token: string;
}

// API
const tokenId = TNum();
export const getTokenParams = TObj({
  tokenId,
});
export type GetTokenParams = Static<typeof getTokenParams>;

export const createTokenRequestBody = TObj({
  name: TStr({ minLength: 1 }),
});
export type CreateTokenRequestBody = Static<typeof createTokenRequestBody>;

export const tokenResponse = TObj({
  ...createTokenRequestBody.properties,
  id: tokenId,
  userId: userId,
  createdAt: DateTime,
  revokedAt: NullableDateTime,
});
export const tokensResponse = TArr(tokenResponse);
