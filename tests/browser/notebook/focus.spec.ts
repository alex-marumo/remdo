import { test } from "./common";
import { Page, expect } from "@playwright/test";

function urlPath(page: Page) {
  return new URL(page.url()).pathname;
}

test("focus on a particular note", async ({ page, notebook }) => {
  // Load the notebook
  await notebook.load("tree_complex");

  // Assert initial URL path
  expect(urlPath(page)).toBe("/");

  // Assert initial breadcrumbs
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(2);
  await expect(page.locator("li.breadcrumb-item").nth(1)).toContainText("main");

  // Assert initial HTML snapshot
  expect(await notebook.html()).toMatchSnapshot("unfocused");

  // Focus on a specific note
  const noteLocator = notebook.noteLocator("note12");
  await expect(noteLocator).toBeVisible();

  // Click to trigger focus
  // Optional: click the margin if the normal click doesn't trigger focus
  /*
  const box = await noteLocator.boundingBox();
  if (!box) throw new Error("note12 is not rendered");
  await page.mouse.click(box.x - 1, box.y + box.height / 2);
  */
  await noteLocator.click();

  // Wait for filtered notes to appear
  await page.waitForSelector("div.editor-input ul.filtered");

  // Assert visible notes
  const visible = await notebook.visibleState();
  const visibleTexts = visible.map(n => n.text);

  expect(Array.isArray(visible)).toBe(true);
  expect(visibleTexts).toEqual(expect.arrayContaining(["note12", "note13"]));
  expect(visibleTexts).not.toContain("note0");
  expect(visibleTexts).not.toContain("note1");

  // Assert full notebook state
  const fullState = await notebook.state();
  expect(fullState.map(n => n.text)).toEqual(expect.arrayContaining(["note12", "note13"]));

  // Snapshot tests
  expect(JSON.stringify(visible, null, 2)).toMatchSnapshot("state-after-note12-focus");
  expect(JSON.stringify(fullState, null, 2)).toMatchSnapshot("all-notes-after-focus");
  expect(await notebook.html()).toMatchSnapshot("focused");

  // Assert URL path updated
  expect(urlPath(page)).not.toBe("/");
});
