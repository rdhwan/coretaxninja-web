import { password } from "bun";
import { authSchema } from "~/models/auth.server";

// parse argv
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: bun generateHash.ts <password>");
  process.exit(1);
}

const inputPassword = args[0];

const data = authSchema.shape.password.parse(inputPassword);

// Generate a hash of the input password
const hash = password.hashSync(data);

// encode with base64
const base64Hash = Buffer.from(hash).toString("base64");

// Output the hash
console.log(base64Hash);
