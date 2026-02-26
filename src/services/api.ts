/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { Locale, LocalizedString } from "@/types/content";
import { getApiBaseUrl } from "@/lib/env";
import type {
  ReservationRequestPayload,
  ReservationRequestResponse,
} from "@/types/reservation";

const BASE_URL = getApiBaseUrl();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        result = await rawBaseQuery(args, api, extraOptions);
      }
    } catch (err) {
      console.error("REFRESH_TOKEN_FAILED", err);
    }
  }

  return result;
};

// ---- API ----

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products", "Home"],
  endpoints: (builder) => ({
    // -------- HOME --------
    createReservationRequest: builder.mutation<
      ReservationRequestResponse,
      ReservationRequestPayload
    >({
      query: (body) => ({
        url: "/reservation-requests",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCreateReservationRequestMutation } = api;
