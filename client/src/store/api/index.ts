/* eslint @typescript-eslint/no-invalid-void-type: 0 */
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import dayjs from "dayjs";

import {
  type UserResponse,
  type CreateUserRequestBody,
  type LoginRequestBody,
  type CoinResponse,
  type HoldingResponse,
  type OrderResponse,
  type CreateOrderRequestBody,
  type CoinHistoricalDataResponse,
} from "@tickr/shared";

import type { RootState } from "..";

interface CoinHistoricalDataRequest {
  coinId: number;
  daysAgo: number;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `http://${window.location.hostname}:3000/api`,
  credentials: "include",
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, queryApi, extraOptions) => {
  const result = await rawBaseQuery(args, queryApi, extraOptions);

  if (result.error?.status === 401) {
    const state = queryApi.getState() as RootState;
    const cachedUser = api.endpoints.me.select()(state).data;
    if (cachedUser) {
      queryApi.dispatch(api.util.resetApiState());
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User", "Coin", "Holding", "Order"],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<UserResponse, CreateUserRequestBody>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<UserResponse, LoginRequestBody>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Holding", "Order"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch((err: unknown) => {
          console.error(err);
        });
        dispatch(api.util.resetApiState());
      },
    }),
    me: builder.query<UserResponse | undefined, void>({
      query: () => "/me",
      providesTags: ["User"],
    }),

    // Coins
    getCoins: builder.query<CoinResponse[], void>({
      query: () => "/coins",
      providesTags: ["Coin"],
    }),
    getCoin: builder.query<CoinResponse, number>({
      query: (coinId) => `/coins/${coinId.toString()}`,
    }),
    getCoinHistoricalData: builder.query<
      CoinHistoricalDataResponse,
      CoinHistoricalDataRequest
    >({
      query: ({ coinId, daysAgo }) =>
        `/coins/${coinId.toString()}/historical/${daysAgo.toString()}`,
    }),

    // Holdings
    getMyHoldings: builder.query<HoldingResponse[], void>({
      query: () => "/me/holdings",
      providesTags: ["Holding"],
    }),

    // Orders
    getMyOrders: builder.query<OrderResponse[], void>({
      query: () => "/me/orders",
      providesTags: ["Order"],
    }),
    createOrder: builder.mutation<OrderResponse, CreateOrderRequestBody>({
      query: (orderRequest) => ({
        url: "/orders",
        method: "POST",
        body: orderRequest,
      }),
      async onQueryStarted(order, { dispatch, queryFulfilled }) {
        const tempId = -Date.now();
        const patch = dispatch(
          api.util.updateQueryData("getMyOrders", undefined, (draft) => {
            const now = dayjs().unix().toString();
            draft.push({
              ...order,
              id: tempId,
              userId: 0,
              filled: false,
              shares_filled: null,
              cost_filled: null,
              target_price: order.target_price ?? null,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            });
          }),
        );
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getMyOrders", undefined, (draft) => {
              const idx = draft.findIndex((o) => o.id === tempId);
              if (idx !== -1) draft[idx] = created;
            }),
          );
        } catch {
          patch.undo();
        }
      },
    }),
    deleteOrder: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/orders/${orderId.toString()}`,
        method: "DELETE",
      }),
      onQueryStarted(orderId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("getMyOrders", undefined, (draft) => {
            return draft.filter((order) => order.id !== orderId);
          }),
        );
        queryFulfilled.catch(() => patch.undo());
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useGetCoinsQuery,
  useGetCoinQuery,
  useGetCoinHistoricalDataQuery,
  useGetMyHoldingsQuery,
  useLazyGetMyHoldingsQuery,
  useGetMyOrdersQuery,
  useLazyGetMyOrdersQuery,
  useCreateOrderMutation,
  useDeleteOrderMutation,
} = api;
