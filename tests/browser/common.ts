//breaks if lexical-playground dependencies are installed
import {
  clearEditor,
  focusEditor,
  getHTML,
  prettifyHTML,
  assertHTML,
  html,
} from "../../lexical/packages/lexical-playground/__tests__/utils/index.mjs";
import { test } from "@playwright/test";
import { Locator, Page } from "playwright";

export function getNoteLocator(page: Page, text: string): Locator {
  return page.locator(".editor-input li :text('" + text + "')");
}

export async function clickEndOfNote(page: Page, text: string) {
  const { width, height } = await getNoteLocator(page, text).boundingBox();
  await getNoteLocator(page, "sample0").click({
    position: { x: width - 1, y: height / 2 },
  });
}

export { assertHTML, clearEditor, html, test };

export async function getEditorHTML(page: Page) {
  return prettifyHTML(await getHTML(page));
}

const SKIP_CONSOLE_MESSAGES = [
  "%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools font-weight:bold",
  "[vite] connecting...",
  "[vite] connected.",
];

test.beforeEach(async ({ page }) => {
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
