import { defineConfig, devices } from '@playwright/test';
import { VIEWPORTS } from './fixtures/viewports';

// Default run uses the XS (375x667) viewport only. Larger viewports are
// opt-in: pass `--project=sm|md|lg|xl` on the CLI to run them. They are
// defined here but excluded from the default filter by only being listed
// after the default XS project — Playwright's `--project` CLI flag selects
// by name, so invocations without `--project` run every project. To enforce
// XS-only default, set PW_VIEWPORTS=all to include the larger ones.
const includeLarger = process.env.PW_VIEWPORTS === 'all';

const largerProjects = [
  { name: 'sm', use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.sm } },
  { name: 'md', use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.md } },
  { name: 'lg', use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.lg } },
  { name: 'xl', use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.xl } },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // The E2E suite shares one API process and one database. Keep local runs
  // bounded so default CPU-count parallelism does not overload the harness.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'xs',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.xs },
    },
    ...(includeLarger ? largerProjects : []),
  ],
  webServer: [
    {
      command: 'npm run start',
      cwd: '../frontend',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'dotnet run --project ../backend/RecallQ.Api/RecallQ.Api.csproj --urls http://localhost:5151',
      url: 'http://localhost:5151/api/ping',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      env: { ADMIN_ENABLED: 'true', RECALLQ_DISABLE_RATE_LIMITS: 'true' },
    },
  ],
});
