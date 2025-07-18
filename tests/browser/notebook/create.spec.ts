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

  // Check initial number of notes
  const initialNotes = await notebook.getNotes();
  const initialLength = initialNotes.length;

  // Select note2 and hit Enter twice
  await notebook.selectNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // Grab notes again
  const notes = await notebook.getNotes();
  expect(notes.length).toBe(initialLength + 2);

  // Ensure the last two notes are empty
  expect(notes[notes.length - 1]).toBe("");
  expect(notes[notes.length - 2]).toBe("");

  // Snapshot for visual diff
  expect(await notebook.html()).toMatchSnapshot();
});

test("split note", async ({ page, notebook }) => {
  await notebook.load("flat");

  // Click at the end of note1, move cursor left twice
  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");

  // Press Enter to split
  await page.keyboard.press("Enter");

  // Verify split result
  const notes = await notebook.getNotes();
  expect(notes.slice(0, 4)).toEqual(['note0', 'not', 'e1', 'note2']); // precise match

  // Snapshot for DOM structure
  expect(await notebook.html()).toMatchSnapshot();
});
