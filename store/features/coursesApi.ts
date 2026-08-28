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
  subjects?: { order?: number; subject: { id: string; name: string } }[];
  videos?: { order?: number; isActive?: boolean; video: { id: string; videoName: string; isActive?: boolean } }[];
  notes?: { order?: number; isActive?: boolean; notes: { id: string; title: string; isActive?: boolean } }[];
  mcqTests?: { order?: number; isActive?: boolean; test: { id: string; testName: string } }[];
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
    linkCourseSubject: builder.mutation<unknown, { courseId: string; subjectId: string; order?: number }>({
      query: ({ courseId, subjectId, order }) => ({
        url: `/courses/${courseId}/subjects`,
        method: "POST",
        body: { subjectId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseSubject: builder.mutation<unknown, { courseId: string; subjectId: string }>({
      query: ({ courseId, subjectId }) => ({
        url: `/courses/${courseId}/subjects/${subjectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseVideo: builder.mutation<unknown, { courseId: string; videoId: string; order?: number }>({
      query: ({ courseId, videoId, order }) => ({
        url: `/courses/${courseId}/videos`,
        method: "POST",
        body: { videoId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseVideo: builder.mutation<unknown, { courseId: string; videoId: string }>({
      query: ({ courseId, videoId }) => ({
        url: `/courses/${courseId}/videos/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseNotes: builder.mutation<unknown, { courseId: string; notesId: string; order?: number }>({
      query: ({ courseId, notesId, order }) => ({
        url: `/courses/${courseId}/notes`,
        method: "POST",
        body: { notesId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseNotes: builder.mutation<unknown, { courseId: string; notesId: string }>({
      query: ({ courseId, notesId }) => ({
        url: `/courses/${courseId}/notes/${notesId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    linkCourseMcqTest: builder.mutation<unknown, { courseId: string; testId: string; order?: number }>({
      query: ({ courseId, testId, order }) => ({
        url: `/courses/${courseId}/mcq-tests`,
        method: "POST",
        body: { testId, order },
      }),
      invalidatesTags: ["Course"],
    }),
    unlinkCourseMcqTest: builder.mutation<unknown, { courseId: string; testId: string }>({
      query: ({ courseId, testId }) => ({
        url: `/courses/${courseId}/mcq-tests/${testId}`,
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
