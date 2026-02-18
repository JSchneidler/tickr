import { createSelector } from "@reduxjs/toolkit";
import {
  BaseQueryFn,
  TypedUseQueryStateResult,
} from "@reduxjs/toolkit/query/react";

import { type HoldingResponse } from "@tickr/shared";

type GetHoldingSelectFromResultArg = TypedUseQueryStateResult<
  HoldingResponse[],
  unknown,
  BaseQueryFn
>;

export const selectHoldingForCoin = createSelector(
  (res: GetHoldingSelectFromResultArg) => res.data,
  (_: GetHoldingSelectFromResultArg, coinId?: number) => coinId,
  (holdings = [], coinId) =>
    coinId ? holdings.find((holding) => holding.coinId === coinId) : undefined,
);
