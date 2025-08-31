import type { ZodError } from "zod";

export function parseZodError(error: ZodError) {
  const errors: Record<string, string> = {};

  error.issues.forEach((err) => {
    if (err.path.length > 0) {
      const key = err.path.join(".");
      if (err.message) {
        errors[key] = err.message;
      } else {
        errors[key] = "Invalid input";
      }
    }
  });
  return errors;
}

export const parseErrorFromFetcher = (data: any): Record<string, string> => {
  return data && "errors" in data && (data.errors as Record<string, string>);
};
