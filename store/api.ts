import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { clearToken, getToken } from "./authStorage";
import { logout } from "./authSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = getToken();

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithAuthHandling: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    const url = typeof args === "string" ? args : args.url;
    const isLoginEndpoint = url.includes("/auth/admin/login");

    if (result.error?.status === 401 && !isLoginEndpoint) {
      api.dispatch(logout());
      clearToken();

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }

    return result;
  };

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: [
    "Course",
    "Video",
    "User",
    "UserAccess",
    "Auth",
    "Comment",
    "Testimonial",
    "Test",
    "Subject",
    "Class",
    "Chapter",
    "Topic",
    "Notes",
    "Enquiry",
  ],
  endpoints: () => ({}),
});
