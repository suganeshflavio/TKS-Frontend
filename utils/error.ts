export function getErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred."
): string {
  if (!error || typeof error !== "object") {
    if (typeof error === "string" && error.trim()) {
      return error;
    }
    return fallbackMessage;
  }

  const err = error as Record<string, unknown>;

  // 1. RTK Query / fetch response error payload (error.data)
  if (err.data) {
    if (typeof err.data === "string" && err.data.trim()) {
      return err.data;
    }

    if (typeof err.data === "object" && err.data !== null) {
      const data = err.data as Record<string, unknown>;

      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }

      if (Array.isArray(data.message) && data.message.length > 0) {
        return data.message.filter(Boolean).join(", ");
      }

      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }

      if (typeof data.msg === "string" && data.msg.trim()) {
        return data.msg;
      }

      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
    }
  }

  // 2. Standard Error or SerializedError (error.message)
  if (typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }

  // 3. RTK Query FetchBaseQueryError network/parsing error (error.error)
  if (typeof err.error === "string" && err.error.trim()) {
    return err.error;
  }

  return fallbackMessage;
}
