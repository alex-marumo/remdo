import { getEditorHTML, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

test.only("check/uncheck", async ({ page }) => {
  await loadEditorState(page, "single");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");
  await page.click("text=note0");

  await page.keyboard.press("Meta+Enter");
  expect(await getEditorHTML(page)).toMatchSnapshot("checked");
  
  await page.keyboard.press("Meta+Enter");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");
});
