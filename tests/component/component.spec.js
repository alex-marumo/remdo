import { test, expect } from "@playwright/experimental-ct-react";
import App from "./App";
import React from "react";

test.use({ viewport: { width: 500, height: 500 } });

test.beforeEach(async ({ page }) => {
  page.on("console", msg => console.log("browser: ", msg));
})

test("should work", async ({ page, mount }) => {
  function testHandler(test) {
    try {
      console.log("in test handler with a parameter", typeof test);
    } catch (e) {
      //we have to catch the exception as otherwise it will be silently eaten
      console.error("error: ", e);
    }
  }
  console.log("in test");
  const component = await mount(<App testHandler={testHandler} />);
  await expect(component).toContainText("Home");
});
