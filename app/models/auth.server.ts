import { z } from "zod";

export const authSchema = z.object({
  username: z
    .string({ error: "Username tidak valid" })
    .min(3, "Username minimal 3 karakter")
    .max(25, "Username maksimal 25 karakter"),
  password: z
    .string({ error: "Password tidak valid" })
    .min(8, "Password minimal 8 karakter")
    .max(25, "Passowrd maksimal 25 karater"),
  "cf-turnstile-response": z
    .string({ error: "Captcha tidak valid" })
    .min(1, "Captcha tidak boleh kosong"),
  // .max(100, "Captcha tidak boleh lebih dari 100 karakter"),
});
