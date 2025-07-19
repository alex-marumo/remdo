import { test } from './common';
import { Page, expect } from '@playwright/test';

function urlPath(page: Page) {
  return new URL(page.url()).pathname;
}

function breadcrumbs(page: Page) {
  return page.locator('li.breadcrumb-item').allTextContents();
}

test('focus on a particular note', async ({ page, notebook }) => {
  // Load complex tree, a canvas of nested dreams
  await notebook.load('tree_complex');

  // Debug: Log HTML to trace the DOM's narrative
  console.log('Initial DOM:', await page.locator('.editor-input ul').first().innerHTML());

  // Verify initial state: root URL, breadcrumbs, and 2 top-level notes
  expect(urlPath(page)).toBe('/');
  await expect(page.locator('li.breadcrumb-item')).toHaveCount(2);
  await expect(page.locator('li.breadcrumb-item').nth(1)).toContainText('main');
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(await notebook.html()).toMatchSnapshot('unfocused');

  // Focus on note12, filtering to its subtree
  const note12Locator = page.locator('.editor-input > ul > li span[data-lexical-text="true"]:text-is("note12")');
  await expect(note12Locator).toBeVisible({ timeout: 5000 });
  const noteBox = (await note12Locator.boundingBox())!;
  await page.mouse.click(noteBox.x - 1, noteBox.y + noteBox.height / 2, { force: true });
  await page.waitForSelector('.editor-input > ul.filtered', { timeout: 5000 });

  // Debug: Log filtered DOM
  console.log('Filtered DOM after note12 focus:', await page.locator('.editor-input > ul.filtered').innerHTML());

  // Verify focused state: note12 with 3 children
  await expect(page.locator('.editor-input > ul.filtered > li')).toHaveCount(1);
  expect(await page.locator('.editor-input > ul.filtered > li span[data-lexical-text="true"]')).toHaveText('note12');
  await expect(page.locator('.editor-input > ul.filtered > li ul > li')).toHaveCount(3); // note120, note1200, note1201
  expect(await page.locator('.editor-input > ul.filtered > li ul > li span[data-lexical-text="true"]')).toHaveText(['note120', 'note1200', 'note1201']);
  expect(await notebook.getNotes()).toEqual(['note12', 'note120', 'note1200', 'note1201']);
  expect(urlPath(page)).not.toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main', 'note1', 'note12']);
  await expect(page.locator('li.breadcrumb-item.active')).toContainText('note12');
  expect(await notebook.html()).toMatchSnapshot('focused');

  // Navigate to note1 via breadcrumb
  const note1Breadcrumb = page.locator('li.breadcrumb-item a').nth(2);
  expect(await note1Breadcrumb.innerText()).toBe('note1');
  await note1Breadcrumb.click();

  // Debug: Log filtered DOM for note1
  console.log('Filtered DOM after note1 focus:', await page.locator('.editor-input > ul.filtered').innerHTML());

  // Verify note1-focused state: note1 with 4 children
  await expect(page.locator('.editor-input > ul.filtered > li')).toHaveCount(1);
  expect(await page.locator('.editor-input > ul.filtered > li span[data-lexical-text="true"]')).toHaveText('note1');
  await expect(page.locator('.editor-input > ul.filtered > li ul > li')).toHaveCount(4); // note10, note11, note12, note120
  expect(await notebook.getNotes()).toEqual(['note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201']);
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main', 'note1']);

  // Navigate back to root
  const rootBreadcrumb = page.locator('li.breadcrumb-item a').nth(1);
  await rootBreadcrumb.click();
  await page.locator('.editor-input > ul > li span[data-lexical-text="true"]:text-is("note12")').waitFor({ timeout: 5000 });

  // Verify root state restored
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(urlPath(page)).toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');
});

test('reload', async ({ page, notebook }) => {
  // Load complex tree, a tapestry of nested notes
  await notebook.load('tree_complex');

  // Debug: Log HTML to inspect the DOM's structure
  console.log('Initial DOM:', await page.locator('.editor-input ul').first().innerHTML());

  // Verify initial state: root URL, breadcrumbs, and 2 top-level notes
  expect(urlPath(page)).toBe('/');
  await expect(page.locator('li.breadcrumb-item')).toHaveCount(2);
  await expect(page.locator('li.breadcrumb-item').nth(1)).toContainText('main');
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(await notebook.html()).toMatchSnapshot('unfocused');

  // Reload page and verify state persists
  await page.reload();
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  await page.locator('.editor-input > ul').waitFor({ timeout: 10000 });
  await page.locator('.editor-input > ul > li span[data-lexical-text="true"]:text-is("note0")').waitFor({ timeout: 10000 });

  // Debug: Log DOM post-reload
  console.log('DOM after reload:', await page.locator('.editor-input ul').first().innerHTML());

  // Verify post-reload: same notes, breadcrumbs, and URL
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2);
  expect(await page.locator('.editor-input > ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1']);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(urlPath(page)).toBe('/');
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']);
  expect(await notebook.html()).toMatchSnapshot('unfocused');
});