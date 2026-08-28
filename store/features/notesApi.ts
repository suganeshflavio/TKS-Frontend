import { appApi } from "../api";
import type { PaginatedResponse } from "./coursesApi";

export type NotesItem = {
  id: string;
  title: string;
  notesUrl?: string;
  notesFileId?: string;
  notesFileName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  topics?: { id: string; name: string }[];
  courses?: { courseId: string; order?: number; isActive?: boolean; course?: { id: string; courseName: string } }[];
};

type NotesQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const unwrapNotes = (response: unknown): NotesItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as NotesItem;
    }
  }

  return response as NotesItem;
};

const unwrapNotesList = (response: unknown): PaginatedResponse<NotesItem> => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const list = record.notes;

      if (Array.isArray(list)) {
        return {
          data: list as NotesItem[],
          total: record.total as number | undefined,
          page: record.page as number | undefined,
          limit: record.limit as number | undefined,
        };
      }
    }
  }

  return { data: [] };
};

export const notesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotesList: builder.query<PaginatedResponse<NotesItem>, NotesQueryParams>({
      query: ({ page = 1, limit = 20, search }) => ({
        url: "/notes",
        method: "GET",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: unwrapNotesList,
      providesTags: ["Notes"],
    }),
    createNotes: builder.mutation<NotesItem, FormData>({
      query: (body) => ({
        url: "/notes",
        method: "POST",
        body,
      }),
      transformResponse: unwrapNotes,
      invalidatesTags: ["Notes"],
    }),
    getNotesById: builder.query<NotesItem, string>({
      query: (id) => ({
        url: `/notes/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapNotes,
      providesTags: ["Notes"],
    }),
    updateNotes: builder.mutation<NotesItem, { id: string; body: FormData | Partial<NotesItem> }>({
      query: ({ id, body }) => ({
        url: `/notes/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapNotes,
      invalidatesTags: ["Notes"],
    }),
    permanentDeleteNotes: builder.mutation<{ success?: boolean }, string>({
      query: (id) => ({
        url: `/notes/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notes"],
    }),
  }),
});

export const {
  useGetNotesListQuery,
  useCreateNotesMutation,
  useGetNotesByIdQuery,
  useUpdateNotesMutation,
  usePermanentDeleteNotesMutation,
} = notesApi;
