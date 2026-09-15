import { appApi } from "../api";

export type CourseItem = {
  id: string;
  title?: string;
  name?: string;
  courseName?: string;
  isActive?: boolean;
  IsActive?: boolean;
  accessType?: "free" | "paid";
  paymentType?: "full" | "emi";
  price?: number;
  strikePrice?: number;
  validityMonths?: number;
  installments?: number;
  bannerFileName?: string;
  thumbnail?: string;
  enableEmi?: boolean;
  subjects?: {
    id: string;
    order?: number;
    subject: { id: string; name: string };
    class?: { id: string; name: string } | null;
  }[];
  videos?: {
    id: string;
    order?: number;
    isActive?: boolean;
    video: { id: string; videoName: string; isActive?: boolean };
    class?: { id: string; name: string } | null;
  }[];
  notes?: {
    id: string;
    order?: number;
    isActive?: boolean;
    notes: { id: string; title: string; isActive?: boolean };
    class?: { id: string; name: string } | null;
  }[];
  mcqTests?: {
    id: string;
    order?: number;
    isActive?: boolean;
    test: { id: string; testName: string };
    class?: { id: string; name: string } | null;
  }[];
};

export type PaginatedResponse<T> = {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
  count?: number;
  page?: number;
  limit?: number;
};

type CourseQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const unwrapCourse = (response: unknown): CourseItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as CourseItem;
    }
  }

  return response as CourseItem;
};

export const coursesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<PaginatedResponse<CourseItem>, CourseQueryParams>({
      async queryFn({ page = 1, limit = 10, search }, _api, _extraOptions, fetchWithBQ) {
        const params = {
          page,
          limit,
          ...(search ? { search } : {}),
        };

        const primary = await fetchWithBQ({
          url: "/courses",
          method: "GET",
          params,
        });

        if (!primary.error) {
          return { data: primary.data as PaginatedResponse<CourseItem> };
        }

        const fallback = await fetchWithBQ({
          url: "/course",
          method: "GET",
          params,
        });

        if (!fallback.error) {
          return { data: fallback.data as PaginatedResponse<CourseItem> };
        }

        return { error: primary.error };
      },
      providesTags: ["Course"],
    }),
    createCourse: builder.mutation<CourseItem, Partial<CourseItem>>({
      query: (body) => ({
        url: "/courses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Course"],
    }),
    getCourseById: builder.query<CourseItem, string>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapCourse,
      providesTags: ["Course"],
    }),
    updateCourse: builder.mutation<CourseItem, { courseId: string; body: Partial<CourseItem> }>({
      query: ({ courseId, body }) => ({
        url: `/courses/${courseId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Course"],
    }),
    permanentDeleteCourse: builder.mutation<{ success?: boolean }, string>({
      query: (courseId) => ({
        url: `/courses/${courseId}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseSubject: builder.mutation<
      unknown,
      { courseId: string; subjectId: string; classId?: string; order?: number }
    >({
      query: ({ courseId, subjectId, classId, order }) => ({
        url: `/courses/${courseId}/subjects`,
        method: "POST",
        body: { subjectId, classId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseSubject: builder.mutation<unknown, { courseId: string; linkId: string }>({
      query: ({ courseId, linkId }) => ({
        url: `/courses/${courseId}/subjects/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseVideo: builder.mutation<
      unknown,
      { courseId: string; videoId: string; classId?: string; order?: number }
    >({
      query: ({ courseId, videoId, classId, order }) => ({
        url: `/courses/${courseId}/videos`,
        method: "POST",
        body: { videoId, classId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseVideo: builder.mutation<unknown, { courseId: string; linkId: string }>({
      query: ({ courseId, linkId }) => ({
        url: `/courses/${courseId}/videos/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseNotes: builder.mutation<
      unknown,
      { courseId: string; notesId: string; classId?: string; order?: number }
    >({
      query: ({ courseId, notesId, classId, order }) => ({
        url: `/courses/${courseId}/notes`,
        method: "POST",
        body: { notesId, classId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseNotes: builder.mutation<unknown, { courseId: string; linkId: string }>({
      query: ({ courseId, linkId }) => ({
        url: `/courses/${courseId}/notes/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseMcqTest: builder.mutation<
      unknown,
      { courseId: string; testId: string; classId?: string; order?: number }
    >({
      query: ({ courseId, testId, classId, order }) => ({
        url: `/courses/${courseId}/mcq-tests`,
        method: "POST",
        body: { testId, classId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseMcqTest: builder.mutation<unknown, { courseId: string; linkId: string }>({
      query: ({ courseId, linkId }) => ({
        url: `/courses/${courseId}/mcq-tests/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useCreateCourseMutation,
  useGetCourseByIdQuery,
  useLazyGetCourseByIdQuery,
  useUpdateCourseMutation,
  usePermanentDeleteCourseMutation,
  useLinkCourseSubjectMutation,
  useUnlinkCourseSubjectMutation,
  useLinkCourseVideoMutation,
  useUnlinkCourseVideoMutation,
  useLinkCourseNotesMutation,
  useUnlinkCourseNotesMutation,
  useLinkCourseMcqTestMutation,
  useUnlinkCourseMcqTestMutation,
} = coursesApi;
