import { getEditorHTML, getNoteLocator, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

/*
just a basic test to make sure that the key bindings work
more complex cases are checked in the unit tests
*/
test("reorder flat", async ({ page }) => {
  await loadEditorState(page, "flat");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");

  await getNoteLocator(page, "note2").selectText();

  await page.keyboard.press("Meta+ArrowUp");
  expect(await getEditorHTML(page)).toMatchSnapshot("note2 moved up");

  await page.keyboard.press("Meta+ArrowUp");
  expect(await getEditorHTML(page)).toMatchSnapshot("note2 moved up x2");

  await page.keyboard.press("Meta+ArrowUp"); //noop
  expect(await getEditorHTML(page)).toMatchSnapshot("note2 moved up x2");

  await page.keyboard.press("Meta+ArrowDown");
  expect(await getEditorHTML(page)).toMatchSnapshot("note2 moved up");

  await page.keyboard.press("Meta+ArrowDown");
  expect(await getEditorHTML(page)).toMatchSnapshot("base");

  await page.keyboard.press("Meta+ArrowDown"); //noop
  expect(await getEditorHTML(page)).toMatchSnapshot("base");
});
