import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type ChapterItem = {
  id: string;
  name: string;
  classId: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  class?: { id: string; name: string; subject?: { id: string; name: string } };
  topics?: { id: string; name: string; isActive?: boolean; order?: number }[];
};

type ChapterQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
};

const unwrapChapter = (response: unknown): ChapterItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as ChapterItem;
    }
  }

  return response as ChapterItem;
};

const unwrapChaptersList = (response: unknown): PaginatedResponse<ChapterItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.chapters;

      if (Array.isArray(list)) {
        return {
          data: list as ChapterItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

export const chaptersApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getChapters: builder.query<PaginatedResponse<ChapterItem>, ChapterQueryParams>({
      query: ({ page = 1, limit = 100, search, classId }) => ({
        url: "/chapters",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(classId ? { classId } : {}),
        },
      }),
      transformResponse: unwrapChaptersList,
      providesTags: ["Chapter"],
    }),
    createChapter: builder.mutation<ChapterItem, { name: string; classId: string }>({
      query: (body) => ({
        url: "/chapters",
        method: "POST",
        body,
      }),
      transformResponse: unwrapChapter,
      invalidatesTags: ["Chapter"],
    }),
    getChapterById: builder.query<ChapterItem, string>({
      query: (id) => ({
        url: `/chapters/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapChapter,
      providesTags: ["Chapter"],
    }),
    updateChapter: builder.mutation<ChapterItem, { id: string; body: { name?: string; isActive?: boolean } }>({
      query: ({ id, body }) => ({
        url: `/chapters/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapChapter,
      invalidatesTags: ["Chapter"],
    }),
    permanentDeleteChapter: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/chapters/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chapter"],
    }),
  }),
});

export const {
  useGetChaptersQuery,
  useCreateChapterMutation,
  useGetChapterByIdQuery,
  useUpdateChapterMutation,
  usePermanentDeleteChapterMutation,
} = chaptersApi;
