import { appApi } from "../api";

export type UserAccessVideoDetail = {
  videoId: string;
  videoName: string;
};

export type UserAccessNotesDetail = {
  notesId: string;
  title: string;
};

export type UserAccessMcqTestDetail = {
  testId: string;
  testName: string;
};

export type UserAccessCourseDetail = {
  courseId: string;
  courseName?: string;
  videos: UserAccessVideoDetail[];
  notes: UserAccessNotesDetail[];
  mcqTests: UserAccessMcqTestDetail[];
};

export type UserAccessDetail = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    mobile?: string;
  };
  courses?: UserAccessCourseDetail[];
};

export type SaveUserAccessCourse = {
  courseId: string;
  videoIds: string[];
  notesIds: string[];
  testIds: string[];
};

export type SaveUserAccessRequest = {
  userId: string;
  courses: SaveUserAccessCourse[];
};

const unwrapUserAccess = (response: unknown): UserAccessDetail => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as UserAccessDetail;
    }
  }

  return (response as UserAccessDetail) ?? {};
};

export const userAccessApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserAccess: builder.query<UserAccessDetail, string>({
      query: (userId) => ({
        url: `/user-access/${userId}`,
        method: "GET",
      }),
      transformResponse: unwrapUserAccess,
      providesTags: (_result, _error, userId) => [{ type: "UserAccess", id: userId }],
    }),
    saveUserAccess: builder.mutation<{ success?: boolean; message?: string }, SaveUserAccessRequest>({
      query: (body) => ({
        url: "/user-access",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "UserAccess", id: body.userId }],
    }),
    updateUserAccess: builder.mutation<{ success?: boolean; message?: string }, SaveUserAccessRequest>({
      query: (body) => ({
        url: `/user-access/${body.userId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "UserAccess", id: body.userId }],
    }),
  }),
});

export const { useGetUserAccessQuery, useSaveUserAccessMutation, useUpdateUserAccessMutation } = userAccessApi;
