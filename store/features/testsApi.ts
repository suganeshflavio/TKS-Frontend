import { appApi } from "../api";
import { skipToken } from "@reduxjs/toolkit/query";

export type TestQuestion = {
  id?: string;
  testId?: string;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  explanation?: string;
};

export type TestItem = {
  id: string;
  testName?: string;
  marksPerQuestion?: number;
  createdAt?: string;
  updatedAt?: string;
  questions?: TestQuestion[];
  topics?: { id?: string; name?: string }[];
  _count?: {
    questions?: number;
    attempts?: number;
  };
};

export type TestsListResponse = {
  tests: TestItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TestAttemptAnswer = {
  questionId?: string;
  question?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  selected?: string;
  correct?: boolean;
  explanation?: string;
};

export type TestAttemptItem = {
  id?: string;
  testId?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  status?: string;
  marksPerQuestion?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  marksObtained?: number;
  obtainedMarks?: number;
  totalMarks?: number;
  score?: number;
  startedAt?: string;
  createdAt?: string;
  submittedAt?: string;
  completedAt?: string;
  student?: {
    id?: string;
    fullName?: string;
    email?: string;
    name?: string;
    mobile?: string;
    class?: string;
  };
  video?: {
    id?: string;
    videoName?: string;
  } | null;
  test?: {
    id?: string;
    testName?: string;
  };
  answers?: TestAttemptAnswer[];
};

export type TestAttemptsListResponse = {
  attempts: TestAttemptItem[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type TestQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
};

type TestAttemptsQueryParams = {
  id: string;
  page?: number;
  limit?: number;
};

const unwrapQuestion = (response: unknown): TestQuestion => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as TestQuestion;
    }
  }

  return response as TestQuestion;
};

type TestCreateRequest = {
  testName: string;
  marksPerQuestion?: number;
  questions?: TestQuestion[];
};

type TestUpdateRequest = {
  testName?: string;
  marksPerQuestion?: number;
};

const unwrapTestsList = (response: unknown): TestsListResponse => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const maybeTests = (data as Record<string, unknown>).tests;
      if (Array.isArray(maybeTests)) {
        return data as TestsListResponse;
      }
    }
  }

  return response as TestsListResponse;
};

const unwrapAttemptsList = (response: unknown): TestAttemptsListResponse => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const attempts = (data as Record<string, unknown>).attempts;
      if (Array.isArray(attempts)) {
        return {
          attempts: attempts as TestAttemptItem[],
          page: (data as Record<string, unknown>).page as number | undefined,
          limit: (data as Record<string, unknown>).limit as number | undefined,
          total: (data as Record<string, unknown>).total as number | undefined,
          totalPages: (data as Record<string, unknown>).totalPages as number | undefined,
        };
      }
    }
  }

  if (Array.isArray(response)) {
    return { attempts: response as TestAttemptItem[] };
  }

  return { attempts: [] };
};

const unwrapTest = (response: unknown): TestItem => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as TestItem;
    }
  }

  return response as TestItem;
};

export const testsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getTests: builder.query<TestsListResponse, TestQueryParams | typeof skipToken>({
      query: (params) => {
        if (params === skipToken) {
          return { url: "/tests", method: "GET" };
        }

        return {
          url: "/tests",
          method: "GET",
          params,
        };
      },
      transformResponse: unwrapTestsList,
      providesTags: [{ type: "Test", id: "LIST" }],
    }),
    createTest: builder.mutation<TestItem, TestCreateRequest>({
      query: (body) => ({
        url: "/tests",
        method: "POST",
        body,
      }),
      transformResponse: unwrapTest,
      invalidatesTags: [{ type: "Test", id: "LIST" }],
    }),
    getTestAttempts: builder.query<TestAttemptsListResponse, TestAttemptsQueryParams | typeof skipToken>({
      query: (params) => {
        if (params === skipToken) {
          return {
            url: "/tests/attempts",
            method: "GET",
          };
        }

        return {
          url: `/tests/${params.id}/attempts`,
          method: "GET",
          params: {
            page: params.page,
            limit: params.limit,
          },
        };
      },
      transformResponse: unwrapAttemptsList,
      providesTags: (_result, _error, args) => {
        if (args === skipToken) {
          return [];
        }

        return [{ type: "Test", id: `${args.id}-attempts-${args.page ?? 1}` }];
      },
    }),
    getTestById: builder.query<TestItem, string>({
      query: (id) => ({
        url: `/tests/${id}`,
        method: "GET",
      }),
      transformResponse: unwrapTest,
      providesTags: (_result, _error, id) => [{ type: "Test", id }],
    }),
    updateTest: builder.mutation<TestItem, { id: string; body: TestUpdateRequest }>({
      query: ({ id, body }) => ({
        url: `/tests/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapTest,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Test", id }, { type: "Test", id: "LIST" }],
    }),
    deleteTest: builder.mutation<{ success?: boolean; data?: { id: string } }, string>({
      query: (id) => ({
        url: `/tests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Test", id: "LIST" }],
    }),
    addQuestion: builder.mutation<TestQuestion, { id: string; body: Omit<TestQuestion, "id" | "testId"> }>({
      query: ({ id, body }) => ({
        url: `/tests/${id}/questions`,
        method: "POST",
        body,
      }),
      transformResponse: unwrapQuestion,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Test", id }, { type: "Test", id: "LIST" }],
    }),
    updateQuestion: builder.mutation<TestQuestion, { id: string; questionId: string; body: Partial<TestQuestion> }>({
      query: ({ id, questionId, body }) => ({
        url: `/tests/${id}/questions/${questionId}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrapQuestion,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Test", id }, { type: "Test", id: "LIST" }],
    }),
    deleteQuestion: builder.mutation<{ success?: boolean; data?: { id: string } }, { id: string; questionId: string }>({
      query: ({ id, questionId }) => ({
        url: `/tests/${id}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Test", id }, { type: "Test", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTestsQuery,
  useCreateTestMutation,
  useGetTestAttemptsQuery,
  useGetTestByIdQuery,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = testsApi;
