import { Prisma } from "../generated/prisma/client";
import { Object as TObj, type Static } from "@sinclair/typebox";

import { userId } from "@tickr/shared";

// Prisma
export type UserWithoutSensitive = Prisma.UserGetPayload<{
  omit: { password_hash: true };
}>;

export interface UserCreateInput
  extends Omit<Prisma.UserCreateInput, "password_hash"> {
  password: string;
}

export interface UserUpdateInput extends Prisma.UserUpdateInput {
  password?: string;
}

// API
export const getUserParams = TObj({
  userId,
});
export type GetUserParams = Static<typeof getUserParams>;
