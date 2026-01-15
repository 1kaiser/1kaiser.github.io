const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  webServer: {
    command: 'python3 -m http.server 8080',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: 'http://localhost:8080',
  },
});
