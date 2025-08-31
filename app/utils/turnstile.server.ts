import axios from "axios";
import ENV from "~/utils/env.server";

const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes": string[];
  action: string;
  cdata: string;
};

export const verifyCaptcha = async (token: string) => {
  const formData = new FormData();

  formData.append("secret", ENV.S_TURNSTILE_SECRET_KEY);
  formData.append("response", token);

  const outcome = await axios.post<TurnstileResponse>(url, formData);

  return outcome.data.success;
};
