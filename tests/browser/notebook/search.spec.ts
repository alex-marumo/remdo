import { test } from "./common";
import { expect } from "@playwright/test";

test("search", async ({ page, notebook }) => {
  await notebook.load("flat");
  const searchInput = page.locator("#search");

  await searchInput.type("note");
  let html = await notebook.html();
  expect(html).toContain("note0");
  expect(html).toContain("note1");
  expect(html).toContain("note2");

  await searchInput.type("1");
  html = await notebook.html();
  expect(html).not.toContain("note0");
  expect(html).toContain("note1");
  expect(html).not.toContain("note2");
});
