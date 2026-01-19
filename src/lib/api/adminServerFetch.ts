import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/env";

const API_BASE_URL = getApiBaseUrl();

export type AdminServerError = Error & { status?: number; payload?: unknown };

async function buildCookieHeader() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  if (!all.length) return undefined;
  return all
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
    .join("; ");
}

async function getAccessToken() {
  const cookieStore = await cookies();
  return (
    cookieStore.get("access_token")?.value ||
    cookieStore.get("access_token_public")?.value ||
    null
  );
}

async function readErrorPayload(res: Response) {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

export async function fetchAdminServerJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = await getAccessToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const cookieHeader = await buildCookieHeader();
  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const payload = await readErrorPayload(res);
    const error = new Error(
      `Admin request failed: ${res.status}. Payload: ${JSON.stringify(
        payload,
        null,
        2
      )}`
    ) as AdminServerError;
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  if (res.status === 204) {
    return null as T;
  }

  return (await res.json()) as T;
}
