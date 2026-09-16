import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type SubjectItem = {
  id: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  classes?: { id: string; name: string; isActive?: boolean }[];
};

type SubjectQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const unwrapSubject = (response: unknown): SubjectItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as SubjectItem;
    }
  }

  return response as SubjectItem;
};

const unwrapSubjectsList = (response: unknown): PaginatedResponse<SubjectItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.subjects;

      if (Array.isArray(list)) {
        return {
          data: list as SubjectItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

export const subjectsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubjects: builder.query<PaginatedResponse<SubjectItem>, SubjectQueryParams>({
      query: ({ page = 1, limit = 100, search }) => ({
        url: "/subjects",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: unwrapSubjectsList,
      providesTags: ["Subject"],
    }),
    createSubject: builder.mutation<SubjectItem, Partial<SubjectItem>>({
      query: (body) => ({
        url: "/subjects",
        method: "POST",
        body,
      }),
      transformResponse: unwrapSubject,
      invalidatesTags: ["Subject"],
    }),
    getSubjectById: builder.query<SubjectItem, string>({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapSubject,
      providesTags: ["Subject"],
    }),
    updateSubject: builder.mutation<SubjectItem, { id: string; body: Partial<SubjectItem> }>({
      query: ({ id, body }) => ({
        url: `/subjects/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapSubject,
      invalidatesTags: ["Subject"],
    }),
    permanentDeleteSubject: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/subjects/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subject"],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  usePermanentDeleteSubjectMutation,
} = subjectsApi;
