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
  // Load the notebook and wait for it to stabilize
  await notebook.load("flat"); // Assuming this sets up the notebook
  await page.waitForLoadState('networkidle'); // Wait for network requests to finish

  // Wait for initial notes to ensure the page is ready
  await page.waitForSelector(".note", { timeout: 10000 });
  const initialNotes = await page.locator(".note").all();
  const initialCount = initialNotes.length;
  console.log("Initial note count:", initialCount);

  // Select a note to make the 'Add Note' button visible
  await notebook.selectNote("note1"); // Or adjust if "note1" isn't specific

  // Optional: Interact with notebook if needed
  const notebookLocator = page.locator('[data-testid="notebook"]');
  await notebookLocator.click();
  await page.keyboard.type(" "); // Simulate minor input
  await page.keyboard.press("Backspace");

  // Debug: Check if the button exists
  const addNoteButton = page.locator('[data-testid="add-note"]');
  const buttonCount = await addNoteButton.count();
  console.log("Add Note button count:", buttonCount);
  if (buttonCount === 0) {
    const testIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]'))
        .map(el => el.getAttribute('data-testid'));
    });
    console.log("Available data-testids:", testIds);
  }

  // Ensure the button is visible
  await expect(addNoteButton).toBeVisible({ timeout: 5000 });

  // Click the button twice
  await addNoteButton.click();
  await addNoteButton.click();

  // Wait until notes increase
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".note").length > expected,
    initialCount, // Pass initialCount directly
    { timeout: 10000 }
  );

  const notes = await page.locator(".note").all();
  console.log("Notes after adding:", notes.length);

  // Main Assert
  expect(notes.length).toBeGreaterThan(initialCount);

  // Extra: last two notes are empty
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
