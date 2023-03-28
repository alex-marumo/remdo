import { clickEndOfNote, getEditorHTML, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

test("add new element after a folded one", async ({ page }) => {
  await loadEditorState(page, "folded");
  await clickEndOfNote(page, "note0");
  await page.keyboard.press("Enter");
  // the original element should stay untouched, the new one should be added 
  // after it, or to be more precise, after the children list of the original one
  expect(await getEditorHTML(page)).toMatchSnapshot();
});
