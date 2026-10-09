import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5179',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 920 },
  },
  webServer: [
    {
      command: 'node server/index.js',
      url: 'http://127.0.0.1:3001/api/me',
      env: {
        DATA_FILE: `./test-results/db-${Date.now()}.json`,
        SEED_PASSWORD: 'LibraFlux@2026',
      },
      reuseExistingServer: false,
    },
    {
      command:
        'npm run dev:client -- --host 127.0.0.1 --port 5179 --strictPort',
      url: 'http://127.0.0.1:5179',
      reuseExistingServer: false,
    },
  ],
})
