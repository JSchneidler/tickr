import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
} from "./auth.controller";
import { createUserRequestBody, userResponse } from "../user/user.schema";
import { loginRequestBody } from "./auth.schema";
import { authenticate } from ".";

export default function (f: FastifyInstance) {
  f.post(
    "/register",
    {
      schema: {
        body: createUserRequestBody,
        response: {
          ...errorResponseSchemas,
          201: userResponse,
        },
      },
    },
    registerHandler,
  );

  f.post(
    "/login",
    {
      schema: {
        body: loginRequestBody,
        response: {
          ...errorResponseSchemas,
          200: userResponse,
        },
      },
    },
    loginHandler,
  );

  f.post(
    "/logout",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
        },
      },
    },
    logoutHandler,
  );
}
