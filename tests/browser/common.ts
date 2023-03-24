//breaks if lexical-playground dependencies are installed
import {
  clearEditor,
  focusEditor,
  getHTML,
  prettifyHTML,
  assertHTML,
  html,
} from "../../lexical/packages/lexical-playground/__tests__/utils/index.mjs";
import { getDataPath } from "../common.js";
import { test } from "@playwright/test";
import fs from "fs";
import { Locator, Page } from "playwright";

export function getNoteLocator(page: Page, text: string): Locator {
  return page.locator(".editor-input li :text('" + text + "')");
}

export async function clickEndOfNote(page: Page, text: string) {
  const noteLocator = getNoteLocator(page, text);
  const { width, height } = await noteLocator.boundingBox();
  await noteLocator.click({
    position: { x: width - 1, y: height / 2 },
  });
}

export { assertHTML, clearEditor, html, test };

export async function getEditorHTML(page: Page) {
  return prettifyHTML(await getHTML(page));
}

//TODO use it in basic.spec.ts
export async function loadEditorState(page: Page, file: string) {
  await page.click("text=Load State");
  const dataPath = getDataPath(file);
  const serializedEditorState = fs.readFileSync(dataPath).toString();
  await page.locator("#editor-state").fill(serializedEditorState);
  await page.click("text=Submit Editor State");
  await page.click("text=Load State");
}

test.beforeEach(async ({ page }) => {
  const SKIP_CONSOLE_MESSAGES = [
    "%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools font-weight:bold",
    "[vite] connecting...",
    "[vite] connected.",
  ];

  page.on("console", message => {
    //console.log(message.text());
    //console.log(SKIP_CONSOLE_MESSAGES.includes(message.text()));
    if (!SKIP_CONSOLE_MESSAGES.includes(message.text())) {
      console.log("Browser:", message);
    }
    if (["warning", "error"].includes(message.type())) {
      console.error(`${message.type} inside the browser: `);
      throw Error(message.text());
    }
  });
  page.on("pageerror", err => {
    console.error("Error inside the browser: ", err.message);
    throw err;
  });

  await page.goto("");
  await focusEditor(page);
});
