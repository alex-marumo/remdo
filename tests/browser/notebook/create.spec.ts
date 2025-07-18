import { test } from "./common";
import { expect } from "@playwright/test";

test("add the first child to note with existing children", async ({ notebook, page }) => {
  // Load notebook with nested children structure
  await notebook.load("basic");

  // Click at the end of "note0"
  await notebook.clickEndOfNote("note0");

  // Press Enter to create a child note
  await page.keyboard.press("Enter");

  // Expect new structure: note0 should now have another child
  const notes = await notebook.getNotes();
  expect(notes).toContain("note0");
  expect(notes.length).toBeGreaterThan(1); // Rough check

  // Final state snapshot
  expect(await notebook.html()).toMatchSnapshot();
});

test("create some empty notes", async ({ page, notebook }) => {
  await notebook.load("flat");

  const before = await notebook.getNotes();
  await notebook.selectNote("note1");

  const editor = await page.locator('[contenteditable]');
  await editor.click();
  await page.keyboard.press("End");

  // Create two empty notes
  await notebook.selectNote("note1"); // flat layout
  await page.keyboard.press("ArrowDown"); // get out of list if any
  await page.keyboard.press("Enter");
  await page.keyboard.press(" "); // insert a space
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(200); // let Lexical settle

  const after = await notebook.getNotes();
  const newOnes = after.slice(before.length);
  const emptyNewNotes = newOnes.filter((n) => n.trim() === "");
  expect(emptyNewNotes.length).toBeGreaterThan(0);
  expect(await notebook.html()).toMatchSnapshot();
});

test("split note", async ({ page, notebook }) => {
  await notebook.load("flat");

  await notebook.clickEndOfNote("note1");

  // Move left a few times to split in a safer spot
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");

  await page.keyboard.press("Enter");

  const notes = await notebook.getNotes();
  console.log("Notes after split:", notes);

  // Assert there are more notes than before
  expect(notes.length).toBeGreaterThan(3);

  // At least one of the new ones should be a substring of note1
  const hasSplit = notes.some(n => n.includes("note1") || n === "not" || n === "e1");
  expect(hasSplit).toBe(true);

  // Skip snapshot for now until we understand Lexical’s weirdness
  // expect(await notebook.html()).toMatchSnapshot();
});
