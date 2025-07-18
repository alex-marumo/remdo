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

  const before = await notebook.getNotes();
  await notebook.selectNote("note1"); // <- pick a mid-list note to avoid edge cases

  const editor = await page.locator('[contenteditable]');
  await editor.click();

  // Create a new line safely
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");

  // Type something and then delete to make it empty
  await page.keyboard.type("temp");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");

 // await page.waitForTimeout(200); // let Lexical chill

  const after = await notebook.getNotes();
  const newOnes = after.slice(before.length);
  const emptyNewNotes = newOnes.filter((n) => n.trim() === "");

  expect(emptyNewNotes.length).toBeGreaterThan(0);
  expect(await notebook.html()).toMatchSnapshot();
});

test("split note", async ({ page, notebook }) => {
  await notebook.load("flat");
  await notebook.clickEndOfNote("note1");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2']);
  await page.keyboard.press("Enter");
  expect(await notebook.getNotes()).toEqual(['note0', 'not', 'e1', 'note2']);
});
