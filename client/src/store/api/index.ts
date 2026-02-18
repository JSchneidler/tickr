/* eslint @typescript-eslint/no-invalid-void-type: 0 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
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

interface CoinHistoricalDataRequest {
  coinId: number;
  daysAgo: number;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `http://${window.location.hostname}:3000/api`,
    credentials: "include",
  }),
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
        try {
          await queryFulfilled;

          dispatch(api.util.resetApiState()); // TODO: Clear all private state (user, orders, holdings)
        } catch (error) {
          console.error("Logout failed:", error);
        }
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
      onQueryStarted(order, { dispatch }) {
        dispatch(
          api.util.updateQueryData("getMyOrders", undefined, (draft) => {
            const now = dayjs().unix().toString();
            draft.push({
              ...order,
              id: 0,
              userId: 0,
              filled: false,
              sharePrice: null,
              totalPrice: null,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            });
          }),
        );
      },
    }),
    deleteOrder: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/orders/${orderId.toString()}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order"],
      onQueryStarted(orderId, { dispatch }) {
        dispatch(
          api.util.updateQueryData("getMyOrders", undefined, (draft) => {
            Object.assign(
              draft,
              draft.filter((order) => order.id !== orderId),
            );
          }),
        );
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
