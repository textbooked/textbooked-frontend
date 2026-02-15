import { apiFetch } from "@/lib/api/api-fetch";

type ApiEnvelope<T> = {
  data: T;
  status: number;
  headers: Headers;
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
};

export async function syncBackendUser(token: string): Promise<CurrentUser> {
  const response = await apiFetch<ApiEnvelope<CurrentUser>>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
