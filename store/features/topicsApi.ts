import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type TopicItem = {
  id: string;
  name: string;
  chapterId: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  chapter?: {
    id: string;
    name: string;
    class?: { id: string; name: string; subject?: { id: string; name: string } };
  };
  videos?: { id: string; videoName: string; isActive?: boolean }[];
  mcqTests?: { id: string; testName: string }[];
  notes?: { id: string; title: string; isActive?: boolean }[];
  _count?: { videos?: number; mcqTests?: number; notes?: number };
};

type TopicQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  chapterId?: string;
};

const unwrapTopic = (response: unknown): TopicItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as TopicItem;
    }
  }

  return response as TopicItem;
};

const unwrapTopicsList = (response: unknown): PaginatedResponse<TopicItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.topics;

      if (Array.isArray(list)) {
        return {
          data: list as TopicItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

export const topicsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getTopics: builder.query<PaginatedResponse<TopicItem>, TopicQueryParams>({
      query: ({ page = 1, limit = 100, search, chapterId }) => ({
        url: "/topics",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(chapterId ? { chapterId } : {}),
        },
      }),
      transformResponse: unwrapTopicsList,
      providesTags: ["Topic"],
    }),
    createTopic: builder.mutation<TopicItem, { name: string; chapterId: string; order?: number }>({
      query: (body) => ({
        url: "/topics",
        method: "POST",
        body,
      }),
      transformResponse: unwrapTopic,
      invalidatesTags: ["Topic"],
    }),
    getTopicById: builder.query<TopicItem, string>({
      query: (id) => ({
        url: `/topics/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapTopic,
      providesTags: ["Topic"],
    }),
    updateTopic: builder.mutation<TopicItem, { id: string; body: { name?: string; order?: number; isActive?: boolean } }>({
      query: ({ id, body }) => ({
        url: `/topics/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapTopic,
      invalidatesTags: ["Topic"],
    }),
    permanentDeleteTopic: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/topics/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Topic"],
    }),
    linkVideoToTopic: builder.mutation<TopicItem, { topicId: string; videoId: string }>({
      query: ({ topicId, videoId }) => ({
        url: `/topics/${topicId}/videos`,
        method: "POST",
        body: { videoId },
      }),
      invalidatesTags: ["Topic", "Video"],
    }),
    unlinkVideoFromTopic: builder.mutation<TopicItem, { topicId: string; videoId: string }>({
      query: ({ topicId, videoId }) => ({
        url: `/topics/${topicId}/videos/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Topic", "Video"],
    }),
    linkMcqTestToTopic: builder.mutation<TopicItem, { topicId: string; testId: string }>({
      query: ({ topicId, testId }) => ({
        url: `/topics/${topicId}/mcq-tests`,
        method: "POST",
        body: { testId },
      }),
      invalidatesTags: ["Topic", "Test"],
    }),
    unlinkMcqTestFromTopic: builder.mutation<TopicItem, { topicId: string; testId: string }>({
      query: ({ topicId, testId }) => ({
        url: `/topics/${topicId}/mcq-tests/${testId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Topic", "Test"],
    }),
    linkNotesToTopic: builder.mutation<TopicItem, { topicId: string; notesId: string }>({
      query: ({ topicId, notesId }) => ({
        url: `/topics/${topicId}/notes`,
        method: "POST",
        body: { notesId },
      }),
      invalidatesTags: ["Topic", "Notes"],
    }),
    unlinkNotesFromTopic: builder.mutation<TopicItem, { topicId: string; notesId: string }>({
      query: ({ topicId, notesId }) => ({
        url: `/topics/${topicId}/notes/${notesId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Topic", "Notes"],
    }),
  }),
});

export const {
  useGetTopicsQuery,
  useCreateTopicMutation,
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
  usePermanentDeleteTopicMutation,
  useLinkVideoToTopicMutation,
  useUnlinkVideoFromTopicMutation,
  useLinkMcqTestToTopicMutation,
  useUnlinkMcqTestFromTopicMutation,
  useLinkNotesToTopicMutation,
  useUnlinkNotesFromTopicMutation,
} = topicsApi;
