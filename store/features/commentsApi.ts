import { appApi } from "../api";

export type CommentItem = {
  id: string;
  username: string;
  role: string;
  message: string;
  dateandtime: string;
  parentId: string | null;
};

export type VideoCommentGroup = {
  videoId: string;
  videoName: string;
  comments: CommentItem[];
};

export type CommentsListResponse = {
  videos: VideoCommentGroup[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CommentsQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const unwrapCommentsList = (response: unknown): CommentsListResponse => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as CommentsListResponse;
    }
  }

  return response as CommentsListResponse;
};

export const commentsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<CommentsListResponse, CommentsQueryParams>({
      query: ({ page = 1, limit = 10, search }) => ({
        url: "/comments",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: unwrapCommentsList,
      providesTags: ["Comment"],
    }),
    replyToComment: builder.mutation<CommentItem, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: `/comments/${id}/reply`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: ["Comment"],
    }),
    deleteComment: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),
  }),
});

export const { useGetCommentsQuery, useReplyToCommentMutation, useDeleteCommentMutation } = commentsApi;
