import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from ".";

export interface ThemeState {
  primaryColor: string;
}

const initialState: ThemeState = {
  primaryColor: "green",
};

export const selectPrimaryColor = (state: RootState) =>
  state.theme.primaryColor;

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
  },
});

export const { setPrimaryColor } = themeSlice.actions;
export default themeSlice.reducer;
