import { test, expect } from "@playwright/test";

test("add the first child to note with existing children", async ({
  notebook,
  page,
}) => {
  // ARRANGE: Load the 'basic' fixture and verify the initial state.
  // We expect one top-level note to start.
  await notebook.load("basic");
  await expect(page.locator("ul > li")).toHaveCount(1);
  expect(await notebook.getNotes()).toEqual(["note0"]);

  // ACT: Create a new line and then indent it to turn it into a child note.
  // Enter creates a sibling; Tab makes it a child.
  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  // ASSERT: Verify the new nested structure.
  // There should still be one top-level note, but now it has a child `ul > li`.
  await expect(page.locator("ul > li")).toHaveCount(1);
  const parentNote = page.locator('li:has-text("note0")');
  await expect(parentNote.locator("ul > li")).toHaveCount(1);
  expect(await notebook.getNotes()).toEqual(["note0", [""]]);

  // Finally, match the snapshot to catch any unexpected structural changes.
  expect(await notebook.html()).toMatchSnapshot("basic-with-child");
});

test("create some empty notes", async ({ page, notebook }) => {
  // ARRANGE: Load the 'flat' fixture, which should have 3 notes.
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await notebook.getNotes()).toEqual(["note0", "note1", "note2"]);

  // ACT: Select the last note and hit Enter twice to add two empty notes.
  await notebook.selectNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // ASSERT: Check that there are now 5 notes in total.
  // `getNotes()` is used here because it reliably handles empty notes.
  await expect(page.locator("ul > li")).toHaveCount(5);
  expect(await notebook.getNotes()).toEqual(["note0", "note1", "note2", "", ""]);

  // Snapshot the final state.
  expect(await notebook.html()).toMatchSnapshot("flat-two-empty");
});

test("split note", async ({ page, notebook }) => {
  // ARRANGE: Load the 'flat' fixture and verify its initial state.
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await notebook.getNotes()).toEqual(["note0", "note1", "note2"]);

  // ACT: Move the cursor into the middle of "note1" and press Enter to split it.
  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // ASSERT: The list should now have 4 notes, with "note1" split into "not" and "e1".
  await expect(page.locator("ul > li")).toHaveCount(4);
  expect(await notebook.getNotes()).toEqual(["note0", "not", "e1", "note2"]);

  // Snapshot the split state.
  expect(await notebook.html()).toMatchSnapshot("flat-split");
});
