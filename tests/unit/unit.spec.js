import { test, expect } from "@playwright/experimental-ct-react";
import App from "./App";
import React from "react";

test.use({ viewport: { width: 500, height: 500 } });

test("should work", async ({ page, mount }) => {
  const component = await mount(<App />);
  await expect(page).toHaveScreenshot();
  await expect(component).toContainText("Home");
});
