import { FastifyRequest } from "fastify";

import { getUsers, getUser, updateUser, deleteUser } from "./user.service";
import { GetUserParams, UpdateUserRequestBody } from "./user.schema";

export async function getUsersHandler() {
  return getUsers();
}

export async function getUserHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
) {
  return getUser(req.params.userId);
}

export async function updateUserHandler(
  req: FastifyRequest<{ Params: GetUserParams; Body: UpdateUserRequestBody }>,
) {
  return updateUser(req.params.userId, req.body);
}

export async function deleteUserHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
) {
  await deleteUser(req.params.userId);
}
