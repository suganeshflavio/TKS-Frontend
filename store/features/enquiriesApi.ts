import { appApi } from "../api";

export type EnquiryItem = {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export type EnquiriesListResponse = {
  enquiries: EnquiryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type EnquiriesQueryParams = {
  page?: number;
  limit?: number;
};

const unwrapEnquiriesList = (response: unknown): EnquiriesListResponse => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as EnquiriesListResponse;
    }
  }

  return response as EnquiriesListResponse;
};

export const enquiriesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnquiries: builder.query<EnquiriesListResponse, EnquiriesQueryParams>({
      query: ({ page = 1, limit = 10 }) => ({
        url: "/enquiries",
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: unwrapEnquiriesList,
      providesTags: ["Enquiry"],
    }),
  }),
});

export const { useGetEnquiriesQuery } = enquiriesApi;