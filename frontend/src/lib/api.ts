import { API_BASE_URL } from "./env";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, headers, ...rest } = options;

  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(typeof window !== "undefined" && window.localStorage.getItem("interview-platform-auth")
        ? { Authorization: `Bearer ${(JSON.parse(window.localStorage.getItem("interview-platform-auth") ?? "{}")).token}` }
        : {}),
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Request failed",
    );
  }

  return response.json() as Promise<T>;
}
