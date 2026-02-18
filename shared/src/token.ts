import {
  Object as TObj,
  String as TStr,
  Number as TNum,
  Array as TArr,
  type Static,
} from "@sinclair/typebox";

import { userId } from "./user";
import { DateTime, NullableDateTime } from "./scalars";

export const tokenId = TNum();

export const createTokenRequestBody = TObj({
  name: TStr({ minLength: 1 }),
});
export type CreateTokenRequestBody = Static<typeof createTokenRequestBody>;

export const tokenResponse = TObj({
  ...createTokenRequestBody.properties,
  id: tokenId,
  userId,
  createdAt: DateTime,
  revokedAt: NullableDateTime,
});
export type TokenResponse = Static<typeof tokenResponse>;

export const tokensResponse = TArr(tokenResponse);
