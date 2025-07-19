import { test } from './common';
import { Page, expect } from '@playwright/test';

function urlPath(page: Page) {
  return new URL(page.url()).pathname;
}

function breadcrumbs(page: Page) {
  return page.locator('li.breadcrumb-item').allTextContents();
}

test('focus on a particular note', async ({ page, notebook }) => {
  // Load complex tree, a sprawling canvas of notes
  await notebook.load('tree_complex');

  // Debug: Log HTML to trace the DOM's intricate narrative
  console.log(await page.locator('.editor-input ul').first().innerHTML());

  // Verify initial state: root URL, breadcrumbs, and 11 top-level notes
  expect(urlPath(page)).toBe('/');
  await expect(page.locator('li.breadcrumb-item')).toHaveCount(2);
  await expect(page.locator('li.breadcrumb-item').nth(1)).toContainText('main');
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(11);
  // Partial getNotes check; refine with debug output if needed
  expect(await notebook.getNotes()).toContain(['note0', 'note1', 'note12']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');

  // Focus on note12, filtering to its subtree
  const noteBox = (await notebook.noteLocator('note12').boundingBox())!;
  await page.mouse.click(noteBox.x - 1, noteBox.y + noteBox.height / 2);
  await page.waitForSelector('div.editor-input ul.filtered');

  // Verify focused state: note12 and potential children, breadcrumbs updated
  await expect(page.locator('.editor-input ul.filtered > li')).toHaveCount(1);
  expect(await page.locator('.editor-input ul.filtered > li span[data-lexical-text="true"]')).toHaveText('note12');
  expect(urlPath(page)).not.toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main', 'note1', 'note12']);
  await expect(page.locator('li.breadcrumb-item.active')).toContainText('note12');
  expect(await notebook.html()).toMatchSnapshot('focused');

  // Navigate to note1 via breadcrumb
  const note1Breadcrumb = page.locator('li.breadcrumb-item a').nth(2);
  expect(await note1Breadcrumb.innerText()).toBe('note1');
  await note1Breadcrumb.click();

  // Verify note1-focused state: note1 with child note12
  await expect(page.locator('.editor-input ul.filtered > li')).toHaveCount(1);
  expect(await page.locator('.editor-input ul.filtered > li span[data-lexical-text="true"]')).toHaveText('note1');
  expect(await notebook.getNotes()).toContain(['note1', 'note12']);
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main', 'note1']);

  // Navigate back to root
  const rootBreadcrumb = page.locator('li.breadcrumb-item a').nth(1);
  await rootBreadcrumb.click();
  await notebook.noteLocator('note12').waitFor();

  // Verify root state restored
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(11);
  expect(await notebook.getNotes()).toContain(['note0', 'note1', 'note12']);
  expect(urlPath(page)).toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');
});

test('reload', async ({ page, notebook }) => {
  // Load complex tree, a tapestry of nested notes
  await notebook.load('tree_complex');

  // Debug: Log HTML to inspect the DOM's structure
  console.log(await page.locator('.editor-input ul').first().innerHTML());

  // Verify initial state: root URL, breadcrumbs, and 11 top-level notes
  expect(urlPath(page)).toBe('/');
  await expect(page.locator('li.breadcrumb-item')).toHaveCount(2);
  await expect(page.locator('li.breadcrumb-item').nth(1)).toContainText('main');
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(11);
  expect(await notebook.getNotes()).toContain(['note0', 'note1', 'note12']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');

  // Reload page and verify state persists
  await page.reload();
  await notebook.noteLocator('note0').waitFor();

  // Verify post-reload: same notes, breadcrumbs, and URL
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(11);
  expect(await page.locator('.editor-input > ul > li span[data-lexical-text="true"]')).toContainText(['note0', 'note1', 'note12']);
  expect(await notebook.getNotes()).toContain(['note0', 'note1', 'note12']);
  expect(urlPath(page)).toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');
});