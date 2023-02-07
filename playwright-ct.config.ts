import browserConfig from "./playwright.config";
import * as viteConfig from "./vite.config";

//require('dotenv').config();

const config = {
  ...browserConfig,
  testDir: "./tests/component",
  use: {
    ctTemplateDir: "./tests/component/playwright",
    ctViteConfig: viteConfig.default,
  },
};

export default config;
