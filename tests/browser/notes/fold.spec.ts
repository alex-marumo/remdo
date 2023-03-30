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

test("fold to a specific level", async ({ page }) => {
  await loadEditorState(page, "tree_complex");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");

  await page.keyboard.press("Shift");
  await page.keyboard.press("Shift");
  await page.keyboard.press("1");
  expect(await getEditorHTML(page)).toMatchSnapshot("level1");

  await page.keyboard.press("Shift");
  await page.keyboard.press("Shift");
  await page.keyboard.press("3");
  expect(await getEditorHTML(page)).toMatchSnapshot("level3");

  await page.keyboard.press("Shift");
  await page.keyboard.press("Shift");
  await page.keyboard.press("0");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");
});
