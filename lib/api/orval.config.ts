import { config as loadEnv } from "dotenv";
import { defineConfig } from "orval";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const backendUrlRaw =
  process.env.ORVAL_BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendUrlRaw) {
  throw new Error(
    "Missing ORVAL_BACKEND_URL or NEXT_PUBLIC_BACKEND_URL for Orval code generation.",
  );
}

const backendUrl = backendUrlRaw.replace(/\/$/, "");
const openApiPathRaw = process.env.NEXT_PUBLIC_OPENAPI_PATH ?? "/swagger-yaml";
const openApiPath = openApiPathRaw.startsWith("/")
  ? openApiPathRaw
  : `/${openApiPathRaw}`;

export default defineConfig({
  core: {
    input: {
      target: `${backendUrl}${openApiPath}`,
    },
    output: {
      target: "./endpoints/core-client.ts",
      schemas: "./schemas",
      client: "react-query",
      mode: "split",
      prettier: false,
      override: {
        mutator: {
          path: "./axios.ts",
        },
      },
    },
  },
  coreAxios: {
    input: {
      target: `${backendUrl}${openApiPath}`,
    },
    output: {
      target: "./endpoints/core-client-axios.ts",
      schemas: "./schemas",
      client: "axios",
      mode: "split",
      prettier: false,
      override: {
        mutator: {
          path: "./axios.ts",
        },
      },
    },
  },
});
