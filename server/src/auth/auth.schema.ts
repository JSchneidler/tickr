import type { UserWithoutSensitive } from "../user/user.schema";

// Prisma
export interface UserWithToken {
  user: UserWithoutSensitive;
  token: string;
}
