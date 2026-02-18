import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { RootState } from ".";
import { type PriceUpdate } from "@tickr/shared";

const pricesAdapter = createEntityAdapter({
  selectId: (livePrice: PriceUpdate) => livePrice.coinId,
});

const livePricesSlice = createSlice({
  name: "livePrices",
  initialState: pricesAdapter.getInitialState(),
  reducers: {
    pricesUpdated(state, action: PayloadAction<PriceUpdate[]>) {
      pricesAdapter.setAll(state, action.payload);
    },
  },
});

export const { selectById, selectEntities } =
  pricesAdapter.getSelectors<RootState>((state) => state.livePrices);
export const { pricesUpdated } = livePricesSlice.actions;
export default livePricesSlice.reducer;
