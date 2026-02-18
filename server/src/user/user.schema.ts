import { Prisma, Role } from "../generated/prisma/client";
import {
  Object as TObj,
  String as TStr,
  Number as TNum,
  Array as TArr,
  Partial,
  Required,
  Omit,
  type Static,
  Enum,
} from "@sinclair/typebox";

import { DateTime, Decimal, NullableDateTime } from "../types";

// Prisma
export type UserWithoutSensitive = Prisma.UserGetPayload<{
  omit: { password_hash: true };
}>;

export interface UserCreateInput extends Omit<
  Prisma.UserCreateInput,
  "password_hash"
> {
  password: string;
}

export interface UserUpdateInput extends Prisma.UserUpdateInput {
  password?: string;
}

// API
export const userId = TNum();

export const getUserParams = TObj({
  userId,
});
export type GetUserParams = Static<typeof getUserParams>;

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
export const usersResponse = TArr(userResponse);
