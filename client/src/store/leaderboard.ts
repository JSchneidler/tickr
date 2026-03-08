import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { type LeaderboardEntry } from "@tickr/shared";

import { RootState } from ".";

interface LeaderboardState {
  entries: LeaderboardEntry[];
}

const initialState: LeaderboardState = {
  entries: [],
};

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {
    leaderboardUpdated(state, action: PayloadAction<LeaderboardEntry[]>) {
      state.entries = action.payload;
    },
  },
});

export const { leaderboardUpdated } = leaderboardSlice.actions;

export const selectLeaderboard = (state: RootState) =>
  state.leaderboard.entries;

export const selectMyRank =
  (userId: number | undefined) => (state: RootState) =>
    userId
      ? state.leaderboard.entries.find((e) => e.userId === userId)
      : undefined;

export default leaderboardSlice.reducer;
