import { test } from "./common";
import { Page, expect } from "@playwright/test";

function urlPath(page: Page) {
  return new URL(page.url()).pathname;
}

test("focus on a particular note", async ({ page, notebook }) => {
  await notebook.load("tree_complex");

  expect(urlPath(page)).toBe("/");

  await expect(page.locator("li.breadcrumb-item")).toHaveCount(2);
  await expect(page.locator("li.breadcrumb-item").nth(1)).toContainText("main");

  expect(await notebook.html()).toMatchSnapshot("unfocused");

  const locator = notebook.noteLocator("note12");
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();
  if (!box) throw new Error("note12 is not rendered");

  console.log("Clicking on margin to trigger focus", box);
  await page.mouse.click(box.x - 1, box.y + box.height / 2);

  await page.waitForSelector("div.editor-input ul.filtered");

  const visible = await notebook.visibleState();
  const visibleTexts = visible.map((n) => n.text);

  const fullState = await notebook.state();

  console.log("visible notes:", visibleTexts);
  console.log("all notes:", fullState.map((n) => n.text));

  expect(visibleTexts).toEqual(expect.arrayContaining(["note12", "note13"]));
  expect(visibleTexts).not.toContain("note0");
  expect(visibleTexts).not.toContain("note1");

  expect(JSON.stringify(visible, null, 2)).toMatchSnapshot("state-after-note12-focus");
  expect(JSON.stringify(fullState, null, 2)).toMatchSnapshot("all-notes-after-focus");

  expect(await notebook.html()).toMatchSnapshot("focused");

  expect(urlPath(page)).not.toBe("/");
});
