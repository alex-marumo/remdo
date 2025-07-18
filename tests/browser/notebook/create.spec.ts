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

  const initialNotes = await notebook.getNotes();

  await notebook.selectNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const notes = await notebook.getNotes();

  // Should be more than before
  expect(notes.length).toBeGreaterThan(initialNotes.length);

  // Get new notes (after the old ones)
  const newNotes = notes.slice(initialNotes.length);

  // All newly created notes should be empty strings
  newNotes.forEach((text) => {
    expect(text).toBe("");
  });

  // Snapshot to validate visual structure
  expect(await notebook.html()).toMatchSnapshot();
});

test("split note", async ({ page, notebook }) => {
  await notebook.load("flat");

  await notebook.clickEndOfNote("note1");

  // Move cursor 4x left to split between 'no' and 'te1'
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");

  await page.keyboard.press("Enter");

  const notes = await notebook.getNotes();
  // Example: ['note0', 'no', 'te1', 'note2']
  expect(notes.length).toBeGreaterThan(3);
  expect(notes[1]).not.toBe("");
  expect(notes[2]).not.toBe("");

  // Final snapshot check
  expect(await notebook.html()).toMatchSnapshot();
});
