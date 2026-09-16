import { appApi } from "../api";

export type UploadedImage = {
  url: string;
  publicId?: string;
};

const unwrapUploadedImage = (response: unknown): UploadedImage => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const data = (response as Record<string, unknown>).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as UploadedImage;
    }
  }

  return response as UploadedImage;
};

export const uploadsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadInlineImage: builder.mutation<UploadedImage, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/uploads/image",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: unwrapUploadedImage,
    }),
  }),
});

export const { useUploadInlineImageMutation } = uploadsApi;
