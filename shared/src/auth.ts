import { Omit, type Static } from "@sinclair/typebox";

import { createUserRequestBody } from "./user";

export const loginRequestBody = Omit(createUserRequestBody, ["name"]);
export type LoginRequestBody = Static<typeof loginRequestBody>;
