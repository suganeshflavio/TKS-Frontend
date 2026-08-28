import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type ClassItem = {
  id: string;
  name: string;
  subjectId: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subject?: { id: string; name: string };
  chapters?: { id: string; name: string; isActive?: boolean }[];
};

type ClassQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
};

const unwrapClass = (response: unknown): ClassItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as ClassItem;
    }
  }

  return response as ClassItem;
};

const unwrapClassesList = (response: unknown): PaginatedResponse<ClassItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.classes;

      if (Array.isArray(list)) {
        return {
          data: list as ClassItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

export const classesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<PaginatedResponse<ClassItem>, ClassQueryParams>({
      query: ({ page = 1, limit = 100, search, subjectId }) => ({
        url: "/classes",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(subjectId ? { subjectId } : {}),
        },
      }),
      transformResponse: unwrapClassesList,
      providesTags: ["Class"],
    }),
    createClass: builder.mutation<ClassItem, { name: string; subjectId: string }>({
      query: (body) => ({
        url: "/classes",
        method: "POST",
        body,
      }),
      transformResponse: unwrapClass,
      invalidatesTags: ["Class"],
    }),
    getClassById: builder.query<ClassItem, string>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapClass,
      providesTags: ["Class"],
    }),
    updateClass: builder.mutation<ClassItem, { id: string; body: { name?: string; isActive?: boolean } }>({
      query: ({ id, body }) => ({
        url: `/classes/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapClass,
      invalidatesTags: ["Class"],
    }),
    permanentDeleteClass: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/classes/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Class"],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useCreateClassMutation,
  useGetClassByIdQuery,
  useUpdateClassMutation,
  usePermanentDeleteClassMutation,
} = classesApi;
