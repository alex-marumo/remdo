import { getDataPath } from "../../common";
import { clickEndOfNote, getEditorHTML, getNoteLocator } from "../common";
import { expect, Page, test } from "@playwright/test";
import fs from "fs";

//TODO use it in basic.spec.ts
async function loadEditorState(page: Page, file: string) {
  await page.click("text=Load State");
  const dataPath = getDataPath(file);
  console.log("Loading from", dataPath);
  const serializedEditorState = fs.readFileSync(dataPath).toString();
  await page.locator("#editor-state").fill(serializedEditorState);
  await page.click("text=Submit Editor State");
  await page.click("text=Load State");
}

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
