import { getEditorHTML, getNoteLocator, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

test("backspace at the beginning of a note", async ({ page }) => {
  //the idea is to make sure that the note is deleted instead of being outdented
  await loadEditorState(page, "basic");
  await getNoteLocator(page, "note1").selectText();
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  expect(await getEditorHTML(page)).toMatchSnapshot();
});
