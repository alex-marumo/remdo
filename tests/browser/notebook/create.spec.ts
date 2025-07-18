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
  // Load a flat notebook structure
  await notebook.load("flat");

  // Select "note2"
  await notebook.selectNote("note2");

  // Press Enter twice to create two empty notes below
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // Verify notes increased — from 3 to 5
  const notes = await notebook.getNotes();
  expect(notes.length).toBe(5);

  // Expect newly created notes to be empty
  expect(notes[3]).toBe(""); 
  expect(notes[4]).toBe(""); 

  // Final structure snapshot
  expect(await notebook.html()).toMatchSnapshot();
});

test("split note", async ({ page, notebook }) => {
  // Load a flat note structure
  await notebook.load("flat");

  // Click inside "note1" and move cursor left twice
  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");

  // Confirm initial notes
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2']);

  // Press Enter to split "note1"
  await page.keyboard.press("Enter");

  // Now "note1" should be split into "not" and "e1"
  expect(await notebook.getNotes()).toEqual(['note0', 'not', 'e1', 'note2']);

  // Snapshot for visual confirmation
  expect(await notebook.html()).toMatchSnapshot();
});
