import { test } from './common';
import { expect } from '@playwright/test';

test("add the first child to note with existing children", async ({ notebook, page }) => {
  // Load notebook with a basic tree structure
  await notebook.load("basic");

  // Verify initial state: at least one note, note0 exists
  await expect(page.locator('ul > li')).toHaveCount(1);
  await expect(page.locator('ul > li span[data-lexical-text="true"]:text-is("note0")')).toHaveCount(1);
  expect(await notebook.html()).toMatchSnapshot("basic-initial");

  // Click end of note0 and add a child note with Enter
  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Enter");

  // Verify child added: note0 has a nested <ul> with one child
  await expect(page.locator('ul > li:has(span[data-lexical-text="true"]:text-is("note0")) > ul > li')).toHaveCount(1);
  await expect(page.locator('ul > li span[data-lexical-text="true"]:text-is("note0")')).toHaveCount(1); // note0 unchanged
  expect(await notebook.html()).toMatchSnapshot("basic-child-added");
});

test("create some empty notes", async ({ page, notebook }) => {
  // Load notebook with a flat list of notes
  await notebook.load("flat");

  // Verify initial state: three notes (note0, note1, note2)
  await expect(page.locator('ul > li')).toHaveCount(3);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2']);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  // Select note2 and add two empty notes with Enter
  await notebook.selectNote("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // Verify two new empty notes added after note2
  await expect(page.locator('ul > li')).toHaveCount(5);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2', '', '']);
  expect(await notebook.html()).toMatchSnapshot("flat-two-empty");
});

test("split note", async ({ page, notebook }) => {
  // Load notebook with a flat list of notes
  await notebook.load("flat");

  // Verify initial state: three notes (note0, note1, note2)
  await expect(page.locator('ul > li')).toHaveCount(3);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2']);
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2']);
  expect(await notebook.html()).toMatchSnapshot("flat-initial");

  // Click end of note1, move cursor left twice, and split with Enter
  await notebook.clickEndOfNote("note1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // Verify note1 split into "not" and "e1", maintaining order
  await expect(page.locator('ul > li')).toHaveCount(4);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'not', 'e1', 'note2']);
  expect(await notebook.getNotes()).toEqual(['note0', 'not', 'e1', 'note2']);
  expect(await notebook.html()).toMatchSnapshot("flat-split");
});
