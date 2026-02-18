import { Object as TObj, type Static } from "@sinclair/typebox";

import { holdingId } from "@tickr/shared";

// API
export const getHoldingParams = TObj({
  holdingId,
});
export type GetHoldingParams = Static<typeof getHoldingParams>;
