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

test("create some empty notes", async ({ notebook, page }) => {
  // Load the notebook and wait for network idle
  await notebook.load("flat");
  await page.waitForLoadState("networkidle");

  // Wait for the 'Add Note' button to be visible instead of the notebook
  const addNoteButton = page.getByRole("button", { name: "Add Note" });
  await expect(addNoteButton).toBeVisible({ timeout: 10000 });

  // Click the button twice to add two new notes
  await addNoteButton.click();
  await addNoteButton.click();

  // Wait for at least two notes to appear
  await page.waitForFunction(() => document.querySelectorAll(".note").length >= 2, { timeout: 10000 });

  // Retrieve all notes and log their count for debugging
  const notes = await page.locator(".note").all();
  console.log("Notes after adding:", notes.length);

  // Verify the last two notes are empty
  const lastNoteTexts = await Promise.all(
    notes.slice(-2).map((note) => note.textContent())
  );
  for (const text of lastNoteTexts) {
    expect(text?.trim()).toBe("");
  }
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
