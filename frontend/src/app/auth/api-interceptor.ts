export function installApiInterceptor(onUnauthorized: () => void): void {
  const original = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const res = await original(...args);
    if (res.status === 401 && isProtectedApi(args[0])) {
      onUnauthorized();
    }
    return res;
  };
}

function isProtectedApi(input: RequestInfo | URL): boolean {
  const url = input instanceof Request ? input.url : String(input);
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  if (!path.startsWith('/api/')) return false;
  if (path.startsWith('/api/auth/')) return false;
  if (path.startsWith('/api/ping')) return false;
  return true;
}
