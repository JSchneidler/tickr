import { Omit, type Static } from "@sinclair/typebox";

import {
  UserWithoutSensitive,
  createUserRequestBody,
} from "../user/user.schema";

// Prisma
export interface UserWithToken {
  user: UserWithoutSensitive;
  token: string;
}

// API
export const loginRequestBody = Omit(createUserRequestBody, ["name"]);
export type LoginRequestBody = Static<typeof loginRequestBody>;
