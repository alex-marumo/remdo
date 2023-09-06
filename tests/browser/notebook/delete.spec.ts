//FIXME add a test for deleting folded notes
import { test } from "./common";
import { expect } from "@playwright/test";

test("backspace at the beginning of a note", async ({ page, notebook }) => {
  //the idea is to make sure that the focused note is deleted instead of being outdented
  await notebook.load("basic");
  await notebook.noteLocator("note1").selectText();
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  expect(await notebook.html()).toMatchSnapshot();
});
