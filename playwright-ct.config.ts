import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import browserConfig from "./playwright.config";
import { defineConfig } from "@playwright/experimental-ct-react";


//require('dotenv').config();

const config = {
  ...browserConfig,
  testDir: "./tests/unit",
  ctPort: 3100,
};

export default config;
