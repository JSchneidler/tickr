import db from "../db";
import { comparePasswordHash } from ".";
import { createToken } from "../token/token.service";
import { UserWithToken } from "./auth.schema";

export async function login(
  email: string,
  password: string,
): Promise<UserWithToken> {
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    omit: { password_hash: false },
  });

  if (
    await comparePasswordHash(
      Buffer.from(password),
      Buffer.from(user.password_hash),
    )
  ) {
    const { token } = await createToken("login", user);
    return {
      user,
      token,
    };
  } else throw new Error("Invalid password");
}
