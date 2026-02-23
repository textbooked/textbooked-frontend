import Axios, { AxiosRequestConfig } from "axios";

export const axios = Axios.create({
  baseURL: getBackendUrl(),
});

export const appendHeader = (header: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing value for ${header}`);
  }

  axios.defaults.headers.common[header] = value;
};

export const removeHeader = (header: string) => {
  delete axios.defaults.headers.common[header];
};

export const appendAccessToken = (accessToken: string | undefined) => {
  appendHeader("Authorization", `Bearer ${accessToken}`);
};

export default async function customInstance<T>(
  config: AxiosRequestConfig<unknown>,
  options?: AxiosRequestConfig<unknown>,
): Promise<T> {
  const { data } = await axios({ ...config, ...options });
  return data;
}

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL.");
  }

  return backendUrl.replace(/\/$/, "");
}
