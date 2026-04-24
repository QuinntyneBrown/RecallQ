import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export interface ScreenshotOptions {
  fullPage?: boolean;
}

export async function screenshot(
  page: Page,
  name: string,
  opts?: ScreenshotOptions,
): Promise<void> {
  const dir = path.resolve(__dirname, '../../docs/tasks/screenshots');
  if (!fs.existsSync(dir)) {
    throw new Error(
      `docs/tasks/screenshots not writable / missing (expected at ${dir})`,
    );
  }
  const target = path.join(dir, `${name}.png`);
  await page.screenshot({ path: target, fullPage: opts?.fullPage ?? false });
}
