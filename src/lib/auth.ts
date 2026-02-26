type RefreshPayload = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  refresh?: string;
};

export async function hasSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function refreshAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as RefreshPayload | null;
    const access =
      data?.accessToken || data?.access_token || data?.token || null;
    if (access) {
      return access;
    }
  } catch {
    return null;
  }
  return null;
}
