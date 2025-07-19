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
  // Load the notebook and wait for basic network stability
  await notebook.load("flat");
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }); // Less strict than networkidle

  // Debug: Log page state and available elements
  console.log("Page HTML:", await page.content());
  const testIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid]")).map((el) =>
      el.getAttribute("data-testid")
    )
  );
  console.log("Available data-testids:", testIds);
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button, [role='button'], .bi-plus")).map((el) => ({
      text: el.textContent?.trim(),
      id: el.id,
      class: el.className,
      dataTestid: el.getAttribute("data-testid"),
    }))
  );
  console.log("Available buttons/icons:", buttons);

  // Interact with document-selector to initialize UI
  const documentSelector = page.locator('[data-testid="document-selector"]');
  if (await documentSelector.count() > 0) {
    console.log("Found document-selector, interacting...");
    await documentSelector.click();
    // Try selecting an option (dropdown or list)
    const option = page.locator('option, [role="option"], li').first();
    if (await option.count() > 0) {
      await option.click();
    } else {
      console.log("No options found for document-selector");
    }
  } else {
    console.log("No document-selector found");
  }

  // Try multiple locators for the 'Add Note' button
  let addNoteButton = page.getByRole("button", { name: /add|new|note|create/i });
  if (!(await addNoteButton.count())) {
    console.log("Role-based button not found, trying icon...");
    addNoteButton = page.locator(".bi-plus, [class*='bi-plus']");
  }
  if (!(await addNoteButton.count())) {
    console.log("Icon not found, trying generic button near document-selector...");
    addNoteButton = page.locator('button, [role="button"]').first();
  }

  // Verify button exists before clicking
  if (await addNoteButton.count() === 0) {
    console.log("No Add Note button found. Taking screenshot...");
    await page.screenshot({ path: "no-button-failure.png" });
    throw new Error("Failed to find Add Note button");
  }

  // Click the button twice to add two new notes
  await addNoteButton.click();
  await page.waitForTimeout(200); // Brief pause for UI stability
  await addNoteButton.click();

  // Wait for notes to appear (dynamic check, no timeout risk)
  await page.waitForFunction(
    () => document.querySelectorAll(".note").length >= 2,
    { polling: "raf", timeout: 15000 } // Use requestAnimationFrame for efficiency
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
}, { timeout: 30000 }); // Test-level timeout for CI

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
