import { test } from "./common";
import { expect } from "@playwright/test";

test("search", async ({ page, notebook }) => {
  await notebook.load("flat");
  const searchInput = page.locator("#search");

  await searchInput.fill("note");
  let html = await notebook.html();
  expect(html).toContain("note0");
  expect(html).toContain("note1");
  expect(html).toContain("note2");

  await searchInput.fill("1");
  html = await notebook.html();
  expect(html).not.toContain("note0");
  expect(html).toContain("note1");
  expect(html).not.toContain("note2");
});

test("find", async ({ page, notebook }) => {
  await notebook.load("tree");
  let html = await notebook.html();

  expect(html).toContain("note0");
  expect(html).toContain("sub note 0");
  expect(html).toContain("note1");
  expect(html).toContain("sub note 1");

  const searchInput = page.locator("#search");
  await searchInput.fill("note0");
  await page.keyboard.press("Enter");

  html = await notebook.html();
  expect(html).toContain("note0");
  expect(html).toContain("sub note 0");
  expect(html).not.toContain("note1");
  expect(html).not.toContain("sub note 1");
});
