import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Hexagon, Lock, User } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/auth._index";
import { authenticator, session } from "~/utils/auth.server";
import ENV from "~/utils/env.server";
import {
  dataWithError,
  redirectWithError,
  redirectWithSuccess,
} from "remix-toast";
import { Turnstile } from "@marsidev/react-turnstile";
import { Form, useFetcher, useNavigation } from "react-router";
import { ZodError } from "zod";
import { parseErrorFromFetcher, parseZodError } from "~/lib/errors";
import { FormErrorMessage } from "~/components/form-error";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const sess = await session.getSession(request.headers.get("Cookie"));
  const user = sess.get("user");

  console.log(user);
  if (user) {
    throw redirectWithError("/dashboard", "Selamat datang kembali!");
  }

  return {
    ENV: {
      C_TURNSTILE_SITE_KEY: ENV.C_TURNSTILE_SITE_KEY,
      C_COMPANY_NAME: ENV.C_COMPANY_NAME,
    },
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const sess = await session.getSession(request.headers.get("Cookie"));
    const user = await authenticator.authenticate("user-pass", request);

    console.log(user);

    sess.set("user", user);

    return redirectWithSuccess("/", "Berhasil masuk!", {
      headers: {
        "Set-Cookie": await session.commitSession(sess),
      },
    });
  } catch (error) {
    console.error("Error during login action:", error);
    if (error instanceof ZodError) {
      return dataWithError(
        {
          success: false,
          message: "Input tidak valid",
          errors: parseZodError(error),
        },
        "Input tidak valid",
        { status: 400 }
      );
    }

    const err = error as Error;

    return dataWithError(
      { success: false, message: err.message },
      err.message,
      { status: 401 }
    );
  }
};

export default function Login({ loaderData }: Route.ComponentProps) {
  const { ENV } = loaderData;
  const fetcher = useFetcher();

  const errors = parseErrorFromFetcher(fetcher.data);

  return (
    <div className="100-svh w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700/50 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Hexagon className="h-8 w-8 text-cyan-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {ENV.C_COMPANY_NAME}
            </span>
          </div>
          <CardTitle className="text-slate-100 text-xl">
            Masuk ke Dashboard
          </CardTitle>
          {/* <p className="text-slate-400 text-sm">Enter your password</p> */}
        </CardHeader>

        <CardContent>
          <fetcher.Form method="POST" className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
                <FormErrorMessage>{errors && errors.username}</FormErrorMessage>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
                <FormErrorMessage>{errors && errors.password}</FormErrorMessage>
              </div>
            </div>

            <div className="space-y-2">
              <Turnstile siteKey={ENV.C_TURNSTILE_SITE_KEY} />
              <FormErrorMessage>
                {errors && errors["cf-turnstile-response"]}
              </FormErrorMessage>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium py-2.5"
              loading={
                fetcher.state === "submitting" || fetcher.state === "loading"
              }
            >
              Login
            </Button>
          </fetcher.Form>

          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 text-center font-mono">
              Made with ❤️ by rdhwan
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
