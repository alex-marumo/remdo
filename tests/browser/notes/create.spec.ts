import { clickEndOfNote, getEditorHTML, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

test("load editor state", async ({ page }) => {
  await loadEditorState(page, "basic");
  expect(await getEditorHTML(page)).toMatchSnapshot();
});

test("add first child to note with existing children", async ({ page }) => {
  await loadEditorState(page, "basic");
  await clickEndOfNote(page, "sample0");
  await page.keyboard.press("Enter");
  expect(await getEditorHTML(page)).toMatchSnapshot();
});
