const envs = [
  "NODE_ENV",
  "S_PASSWORD_HASH",
  "S_USERNAME",
  "S_SESSION_SECRET",
  "S_NINJA_API_URL",
  "S_NINJA_API_KEY",
  "C_COMPANY_NAME",
  "C_TURNSTILE_SITE_KEY",
  "S_TURNSTILE_SECRET_KEY",
];

envs.forEach((env) => {
  if (!process.env[env]) {
    console.error("[Error]: Environment variable not found: ", env);
    process.exit(-1);
  }
});

const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  S_PASSWORD_HASH: process.env.S_PASSWORD_HASH || "",
  S_USERNAME: process.env.S_USERNAME || "",
  S_SESSION_SECRET: process.env.S_SESSION_SECRET || "",
  S_NINJA_API_URL: process.env.S_NINJA_API_URL || "",
  S_NINJA_API_KEY: process.env.S_NINJA_API_KEY || "",
  C_COMPANY_NAME: process.env.C_COMPANY_NAME || "Default Company Name",
  C_TURNSTILE_SITE_KEY: process.env.C_TURNSTILE_SITE_KEY || "",
  S_TURNSTILE_SECRET_KEY: process.env.S_TURNSTILE_SECRET_KEY || "",
};

export default ENV;
