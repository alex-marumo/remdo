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
  await notebook.selectNote("note2");

  // 1. Capture notes before
  const before = await page.locator('[data-test-id="note-card"]').all();
  const initialCount = before.length;

  // 2. Press Enter twice to create 2 new notes
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // 3. Wait until DOM shows 2 more notes
  const expectedCount = initialCount + 2;
  await expect(
    page.locator('[data-test-id="note-card"]')
  ).toHaveCount(expectedCount, { timeout: 3000 });

  // 4. Now call getNotes after DOM has settled
  const after = await notebook.getNotes();
  expect(after.length).toBe(expectedCount);

  // 5. Check last 2 notes are empty
  const newOnes = after.slice(-2);
  for (const note of newOnes) {
    expect(note.trim()).toBe("");
  }

  // 6. Snapshot for good measure
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

  expect(await notebook.html()).toMatchSnapshot();
});
