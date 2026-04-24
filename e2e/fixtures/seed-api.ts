// Minimal API client shape used by later tests to arrange state. The backend
// endpoints referenced here don't exist yet — this file defines the surface
// only. Do not call these methods from T002.

export interface ApiClient {
  login(email: string, password: string): Promise<string>;
  postJson<T = unknown>(path: string, body: unknown, token?: string): Promise<T>;
}

export function apiClient(baseURL: string): ApiClient {
  const join = (p: string) =>
    `${baseURL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

  return {
    async login(email: string, password: string): Promise<string> {
      const res = await fetch(join('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(`login failed: ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as { token: string };
      return json.token;
    },

    async postJson<T = unknown>(
      path: string,
      body: unknown,
      token?: string,
    ): Promise<T> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(join(path), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    },
  };
}
