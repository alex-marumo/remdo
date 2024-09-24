import { test } from "./common";
import { expect } from "@playwright/test";

test("add the first child to note with existing children", async ({
  notebook,
  page,
}) => {
  await notebook.load("basic");
  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Enter");
  expect(await notebook.html()).toMatchSnapshot();
});

test("create some empty notes", async ({ page, notebook }) => {
  await notebook.load("flat");
  await notebook.selectNote("note2");

  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  expect(await notebook.html()).toMatchSnapshot();
});

