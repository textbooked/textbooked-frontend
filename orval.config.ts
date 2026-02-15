import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "orval";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const backendUrlRaw = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendUrlRaw) {
  throw new Error("Missing NEXT_PUBLIC_BACKEND_URL for Orval code generation.");
}

const backendUrl = backendUrlRaw.replace(/\/$/, "");
const openApiPathRaw = process.env.NEXT_PUBLIC_OPENAPI_PATH ?? "/swagger-json";
const openApiPath = openApiPathRaw.startsWith("/")
  ? openApiPathRaw
  : `/${openApiPathRaw}`;

export default defineConfig({
  textbooked: {
    input: {
      target: `${backendUrl}${openApiPath}`,
    },
    output: {
      target: "./lib/api/generated/textbooked.ts",
      schemas: "./lib/api/generated/models",
      client: "fetch",
      mode: "split",
      prettier: true,
      override: {
        mutator: {
          path: path.resolve(process.cwd(), "lib/api/orval-mutator.ts"),
          name: "orvalFetcher",
        },
      },
    },
  },
});
