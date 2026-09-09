import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  testDir: '.',
  testMatch: 'medpredict-demo.playwright.ts',
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: false,
    launchOptions: { slowMo: 100 },
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    actionTimeout: 7_000,
    navigationTimeout: 10_000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    cwd: projectRoot,
    url: 'http://127.0.0.1:5173/admin',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
