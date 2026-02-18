import {
  combineReducers,
  configureStore,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import { api } from "./api";
import theme from "./themeSlice";
import livePrices from "./livePrices";
import { webSocketMiddleware } from "./webSocketMiddleware";

// combineReducers avoids a circular dependency with AppStore and the webSocketMiddleware.
// See: https://redux.js.org/usage/usage-with-typescript#type-checking-middleware
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  livePrices,
  theme,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).concat(webSocketMiddleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = AppStore["dispatch"];

export const createAppAsyncThunk = () =>
  createAsyncThunk.withTypes<{
    state: RootState;
    dispatch: AppDispatch;
  }>();
