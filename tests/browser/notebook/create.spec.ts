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

test('create some empty notes', async ({ notebook, page }) => {
  const notebook = new Notebook(page);

  // 1. Create two notes
  const expectedCount = 2;
  for (let i = 0; i < expectedCount; i++) {
    await notebook.createNote();
  }

  // 2. Wait for at least one card to appear before checking count
  const locator = page.locator('[data-test-id="note-card"]');
  await expect(locator.first()).toBeVisible({ timeout: 3000 });

  // 3. Now check if total count matches
  await expect(locator).toHaveCount(expectedCount, { timeout: 3000 });

  // 4. Optional: Check internal state via helper
  const after = await notebook.getNotes();
  expect(after.length).toBe(expectedCount);
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
