import { dataWithError } from "remix-toast";
import type { Route } from "./+types/auth.logout";
import { destroySession } from "~/utils/auth.server";

export const action = async ({ request }: Route.ActionArgs) => {
  try {
    return await destroySession(request, {
      state: "success",
      message: "You have been logged out successfully.",
    });
  } catch (error) {
    console.error("Error during logout action:", error);
    return dataWithError(
      {
        success: false,
        message: "An unexpected error occurred during logout.",
      },
      "Logout Error",
      { status: 500 }
    );
  }
};
