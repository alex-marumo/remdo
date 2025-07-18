import { test } from "./common";
import { expect } from "@playwright/test";

test("add the first child to note with existing children", async ({
  notebook,
  page,
}) => {
  await notebook.load("basic");
  const note0 = page.locator('ul > li:has(span[data-lexical-text="true"]:text-is("note0"))');
  await expect(note0).toBeVisible();
  expect(await notebook.html()).toMatchSnapshot("basic-initial");

  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  const childNote = note0.locator("ul > li");
  await expect(childNote).toHaveCount(1);
  await expect(childNote).toHaveText("");
  expect(await notebook.html()).toMatchSnapshot("basic-with-child");
});

test("create some empty notes", async ({ page, notebook }) => {
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  await notebook.clickEndOfNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await expect(page.locator("ul > li")).toHaveCount(5);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
    "",
    "",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-two-empty");
});

test("split note", async ({ page, notebook }) => {
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  await expect(page.locator("ul > li")).toHaveCount(4);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "not",
    "e1",
    "note2",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-split");
});