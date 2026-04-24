import { Page } from '@playwright/test';

export function api(page: Page) {
  return {
    async search(q: string) {
      const res = await page.request.post('/api/search', { data: { q } });
      if (!res.ok()) return { results: [] as any[] };
      const body = await res.json();
      return { results: body.results ?? [] };
    },
    async addContact(data: any) {
      const res = await page.request.post('/api/contacts', { data });
      return res.ok() ? await res.json() : null;
    },
    async login(email: string, password: string) {
      const res = await page.request.post('/api/auth/login', {
        data: { email, password },
      });
      return res.ok() ? await res.json() : null;
    },
  };
}
