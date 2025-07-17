import { test } from './common';
import { expect } from '@playwright/test';

test("check/uncheck", async ({ page, notebook }) => {
  // Load a single note
  await notebook.load("single");

  // Verify initial state: one note with text "note0", not checked
  await expect(page.locator('ul > li')).toHaveCount(1);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText('note0');
  await expect(page.locator('li.li-checked')).toHaveCount(0);

  // Click end of note0 and toggle check with meta+Enter
  await notebook.clickEndOfNote("note0");
  await page.keyboard.press("Meta+Enter");

  // Verify checked state: note0 has li-checked class
  await expect(page.locator('li.li-checked')).toHaveCount(1);
  await expect(page.locator('li.li-checked span[data-lexical-text="true"]')).toHaveText('note0');

  // Toggle uncheck with meta+Enter
  await page.keyboard.press("Meta+Enter");

  // Verify unchecked state: no li-checked class, text unchanged
  await expect(page.locator('li.li-checked')).toHaveCount(0);
  await expect(page.locator('ul > li span[data-lexical-text="true"]')).toHaveText('note0');
});
