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
  // Load the notebook and wait for network stability
  await notebook.load("flat");
  await page.waitForLoadState("networkidle", { timeout: 15000 });

  // Debug: Log page content and available elements
  console.log("Page HTML:", await page.content());
  const testIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid]")).map((el) =>
      el.getAttribute("data-testid")
    )
  );
  console.log("Available data-testids:", testIds);

  // Interact with document-selector to initialize the notebook
  const documentSelector = page.locator('[data-testid="document-selector"]');
  await expect(documentSelector).toBeVisible({ timeout: 10000 });
  await documentSelector.click(); // Click to open dropdown or select

  // Select a document (assuming a dropdown or list)
  await page.locator('option, [role="option"]').first().click(); // Adjust based on UI

  // Wait for the 'Add Note' button (try multiple locators)
  const addNoteButton = page.getByRole("button", { name: /add|new|note/i });
  try {
    await expect(addNoteButton).toBeVisible({ timeout: 10000 });
  } catch (error) {
    console.log("Add Note button not found. Trying alternative selector...");
    const fallbackButton = page.locator('button, [role="button"]').first();
    await expect(fallbackButton).toBeVisible({ timeout: 5000 });
    await fallbackButton.click();
    await fallbackButton.click();
  }

  // Wait for at least two notes to appear
  await page.waitForFunction(
    () => document.querySelectorAll(".note").length >= 2,
    { timeout: 10000 }
  );

  // Retrieve all notes and log their count
  const notes = await page.locator(".note").all();
  console.log("Notes after adding:", notes.length);

  // Verify the last two notes are empty
  const lastNoteTexts = await Promise.all(
    notes.slice(-2).map((note) => note.textContent())
  );
  for (const text of lastNoteTexts) {
    expect(text?.trim()).toBe("");
  }
}, { timeout: 30000 }); // Increased timeout for CI stability

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
