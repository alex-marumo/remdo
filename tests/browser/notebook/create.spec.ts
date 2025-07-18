import { test } from "./common";
import { expect } from "@playwright/test";

test("add the first child to note with existing children", async ({
  notebook,
  page,
}) => {
  // ARRANGE: Load the 'basic' fixture.
  await notebook.load("basic");

  // Use a more specific locator to avoid strict mode violations.
  // This targets a `li` that directly contains a span with the exact text "note0".
  const note0 = page.locator('ul > li:has(span[data-lexical-text="true"]:text-is("note0"))');
  await expect(note0).toBeVisible();
  expect(await notebook.html()).toMatchSnapshot("basic-initial");

  // ACT: Click the note, hit Enter to create a new line, then Tab to make it a child.
  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  // ASSERT: Verify that note0 now contains a nested list with one empty child note.
  const childNote = note0.locator("ul > li");
  await expect(childNote).toHaveCount(1);
  await expect(childNote).toHaveText("");
  expect(await notebook.html()).toMatchSnapshot("basic-with-child");
});

test("create some empty notes", async ({ page, notebook }) => {
  // ARRANGE: Load the 'flat' fixture, which should have 3 notes.
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  // ACT: Click the END of the last note, then hit Enter twice.
  // This correctly adds new notes AFTER the target, instead of replacing it.
  await notebook.clickEndOfNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // ASSERT: Check that there are now 5 notes.
  await expect(page.locator("ul > li")).toHaveCount(5);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
    "",
    "",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-two-empty");
});

test("split note", async ({ page, notebook }) => {
  // ARRANGE: Load the 'flat' fixture and verify its initial state.
  await notebook.load("flat");
  await expect(page.locator("ul > li")).toHaveCount(3);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "note1",
    "note2",
  ]);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  // ACT: Move the cursor into the middle of "note1" and press Enter to split it.
  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // ASSERT: The list should now have 4 notes, with "note1" split into "not" and "e1".
  await expect(page.locator("ul > li")).toHaveCount(4);
  expect(await page.locator("ul > li").allTextContents()).toEqual([
    "note0",
    "not",
    "e1",
    "note2",
  ]);
  // NOTE: This will fail in CI on the first run.
  // need to run `npx playwright test --update-snapshots` locally and commit the new file(will attend to that later)
  expect(await notebook.html()).toMatchSnapshot("flat-split");
});

