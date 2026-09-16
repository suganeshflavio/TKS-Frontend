import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type VideoItem = {
  id: string;
  isActive?: boolean;
  IsActive?: boolean;
  videoName?: string;
  title?: string;
  description?: string;
  duration?: string;
  isPreview?: boolean;
  videoUrl?: string;
  videoFileId?: string;
  videoFileName?: string;
  videoSize?: number;
  topics?: { id: string; name: string }[];
  courses?: { courseId: string; order?: number; isActive?: boolean; course?: { id: string; courseName: string } }[];
};

type VideoQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type VideoUploadUrlRequest = {
  fileName: string;
};

export type VideoUploadUrlResponse = {
  uploadUrl: string;
  fileName: string;
  headers: Record<string, string>;
};

const unwrapVideo = (response: unknown): VideoItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as VideoItem;
    }
  }

  return response as VideoItem;
};

const unwrapVideosList = (response: unknown): PaginatedResponse<VideoItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.videos;

      if (Array.isArray(list)) {
        return {
          data: list as VideoItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

const unwrapVideoUploadUrl = (response: unknown): VideoUploadUrlResponse => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as VideoUploadUrlResponse;
    }
  }

  return response as VideoUploadUrlResponse;
};

export const videosApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getVideos: builder.query<PaginatedResponse<VideoItem>, VideoQueryParams>({
      query: ({ page = 1, limit = 20, search }) => ({
        url: "/videos",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: unwrapVideosList,
      providesTags: ["Video"],
    }),
    createVideo: builder.mutation<VideoItem, Partial<VideoItem>>({
      query: (body) => ({
        url: "/videos",
        method: "POST",
        body,
      }),
      transformResponse: unwrapVideo,
      invalidatesTags: ["Video"],
    }),
    getVideoById: builder.query<VideoItem, string>({
      query: (id) => ({
        url: `/videos/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapVideo,
      providesTags: ["Video"],
    }),
    updateVideo: builder.mutation<VideoItem, { id: string; body: Partial<VideoItem> }>({
      query: ({ id, body }) => ({
        url: `/videos/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapVideo,
      invalidatesTags: ["Video"],
    }),
    permanentDeleteVideo: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/videos/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Video"],
    }),
    getVideoUploadUrl: builder.mutation<VideoUploadUrlResponse, VideoUploadUrlRequest>({
      query: (body) => ({
        url: "/videos/upload-url",
        method: "POST",
        body,
      }),
      transformResponse: unwrapVideoUploadUrl,
    }),
  }),
});

export const {
  useGetVideosQuery,
  useCreateVideoMutation,
  useGetVideoByIdQuery,
  useUpdateVideoMutation,
  usePermanentDeleteVideoMutation,
  useGetVideoUploadUrlMutation,
} = videosApi;
