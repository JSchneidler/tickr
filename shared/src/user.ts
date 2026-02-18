import {
  Object as TObj,
  String as TStr,
  Number as TNum,
  Array as TArr,
  Partial,
  Required,
  Omit,
  Enum,
  type Static,
} from "@sinclair/typebox";

import { DateTime, Decimal, NullableDateTime } from "./scalars";
import { Role } from "./enums";

export const userId = TNum();

export const createUserRequestBody = TObj({
  email: TStr({ minLength: 5 }),
  name: TStr({ minLength: 1 }),
  password: TStr({ minLength: 10 }),
});
export type CreateUserRequestBody = Static<typeof createUserRequestBody>;

export const updateUserRequestBody = TObj({
  ...Partial(createUserRequestBody).properties,
  role: Enum(Role),
});
export type UpdateUserRequestBody = Static<typeof updateUserRequestBody>;

export const userResponse = TObj({
  ...Required(Omit(updateUserRequestBody, ["password"])).properties,
  id: userId,
  deposits: Decimal,
  balance: Decimal,
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: NullableDateTime,
});
export type UserResponse = Static<typeof userResponse>;

export const usersResponse = TArr(userResponse);
