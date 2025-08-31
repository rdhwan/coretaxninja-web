import { Authenticator } from "remix-auth";
import {
  createCookieSessionStorage,
  unstable_createContext,
  type Session,
} from "react-router";
import ENV from "./env.server";
import { FormStrategy } from "remix-auth-form";
import { authSchema } from "~/models/auth.server";
import { verifyCaptcha } from "./turnstile.server";
import { redirectWithError, redirectWithSuccess } from "remix-toast";
import type { Route } from "../routes/+types/auth._index";

type User = {
  username: string;
};

type SessionData = {
  user: User;
};

// Create a session storage
export const session = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [ENV.S_SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export const authenticator = new Authenticator<User>();
authenticator.use(
  new FormStrategy(async ({ form }) => {
    const body = Object.fromEntries(form.entries());
    const data = await authSchema.parseAsync(body);

    const captchaResult = await verifyCaptcha(data["cf-turnstile-response"]);
    if (!captchaResult) {
      throw new Error("Captcha verification failed");
    }

    if (data.username !== ENV.S_USERNAME) {
      throw new Error("Username tidak valid");
    }

    const decodedHash = Buffer.from(ENV.S_PASSWORD_HASH, "base64").toString(
      "utf-8"
    );

    if (!(await Bun.password.verify(data.password, decodedHash))) {
      throw new Error("Password tidak valid");
    }

    return {
      username: data.username,
    };
  }),
  "user-pass"
);

/**
 *
 * @param request - The request object from the loader or action function.
 * @returns The user object from the session.
 *
 * DO NOT USE THIS FUNCTION IN LOGIN
 */
export async function getSession(
  request: Request,
  injectedSess?: Session<SessionData>
) {
  const sess = await session.getSession(request.headers.get("Cookie"));

  const user = injectedSess ? injectedSess.get("user") : sess.get("user");

  if (!user) {
    throw await redirectWithError("/auth", "Please login first.", {
      headers: {
        "Set-Cookie": await session.destroySession(sess),
      },
    });
  }

  if (user.username !== ENV.S_USERNAME) {
    throw await redirectWithError("/auth", "Invalid user.", {
      headers: {
        "Set-Cookie": await session.destroySession(sess),
      },
    });
  }

  return user;
}

type DestroySessionToastOptions = {
  state: "success" | "error";
  message: string;
};

export const destroySession = async (
  request: Request,
  options: DestroySessionToastOptions = {
    state: "success",
    message: "You have been logged out.",
  }
) => {
  const sess = await session.getSession(request.headers.get("Cookie"));

  if (options.state === "success") {
    return redirectWithSuccess("/auth", options.message, {
      headers: {
        "Set-Cookie": await session.destroySession(sess),
      },
    });
  }

  return redirectWithError("/auth", options.message, {
    headers: {
      "Set-Cookie": await session.destroySession(sess),
    },
  });
};

type UserSessionContext = Awaited<ReturnType<typeof getSession>>;

export const userDataContext = unstable_createContext<UserSessionContext>();

export const unstable_userMiddleware: Route.unstable_MiddlewareFunction =
  async ({ request, context }) => {
    const userData = await getSession(request);

    context.set(userDataContext, userData);
  };
