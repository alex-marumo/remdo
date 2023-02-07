import browserConfig from "./playwright.config";
import * as viteConfig from "./vite.config";

//require('dotenv').config();

const config = {
  ...browserConfig,
  testDir: "./tests/component",
  use: {
    ctTemplateDir: "./tests/component/playwright",
    ctViteConfig: {
      resolve: {
        //@ts-ignore
        alias: viteConfig.default.resolve.alias,
      },
      //@ts-ignore
      plugins: [...viteConfig.default.plugins],
    },
  },
};

export default config;
