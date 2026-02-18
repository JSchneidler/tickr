import db from "../db";
import { CreateToken, TokenWithoutSensitive } from "./token.schema";
import { UserWithoutSensitive } from "../user/user.schema";

import { generateJwt } from "../auth";

export async function createToken(
  name: string,
  user: UserWithoutSensitive,
): Promise<CreateToken> {
  const { token, hash } = await generateJwt(user);

  const accessToken = await db.accessToken.create({
    data: { name, token_hash: hash, User: { connect: { id: user.id } } },
  });

  return {
    token,
    accessToken,
  };
}

export async function getTokens(): Promise<TokenWithoutSensitive[]> {
  return db.accessToken.findMany();
}

export async function getTokensForUser(
  userId: number,
): Promise<TokenWithoutSensitive[]> {
  return db.accessToken.findMany({ where: { userId } });
}

export async function getToken(id: number): Promise<TokenWithoutSensitive> {
  return db.accessToken.findUniqueOrThrow({ where: { id } });
}

export async function revokeToken(id: number): Promise<void> {
  await db.accessToken.delete({ where: { id } });
}
