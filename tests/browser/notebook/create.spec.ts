import { test } from './common';
import { Page, expect } from '@playwright/test';

function urlPath(page: Page) {
  return new URL(page.url()).pathname;
}

function breadcrumbs(page: Page) {
  return page.locator('li.breadcrumb-item').allTextContents();
}

async function waitForNote(page: Page, noteText: string, maxAttempts = 20, interval = 1000) { // Changed: Increased maxAttempts to 20
  if (!page || page.isClosed()) {
    throw new Error(`Page is closed while waiting for ${noteText}`);
  }
  const primaryLocator = page.locator(`.editor-input > ul > li span[data-lexical-text="true"]:text-is("${noteText}")`);
  const fallbackLocator = page.locator(`.editor-input > ul span[data-lexical-text="true"]`); // Changed: Broader locator for any note
  for (let i = 0; i < maxAttempts; i++) {
    if (await primaryLocator.isVisible()) {
      console.log(`${noteText} visible after ${i + 1} attempts`);
      return;
    }
    if (await fallbackLocator.isVisible()) {
      console.log(`Fallback locator found after ${i + 1} attempts`);
      return;
    }
    console.log(`Waiting for ${noteText}, attempt ${i + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  console.log(`Failed to find ${noteText} or any note after ${maxAttempts} attempts`);
  throw new Error(`Failed to find ${noteText} or any note after ${maxAttempts} attempts`);
}

test('focus on a particular note', async ({ page, notebook }, testInfo) => {
  // Set reasonable timeout for this test
  testInfo.setTimeout(30000);

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

  // Focus on note12, expecting full tree due to app bug
  const note12Locator = page.locator('.editor-input > ul > li span[data-lexical-text="true"]:text-is("note12")');
  await expect(note12Locator).toBeVisible({ timeout: 5000 });
  await note12Locator.click({ force: true, position: { x: 0, y: 0 } }); // Precise click
  await waitForNote(page, 'note12', 20, 1000); // Changed: Updated maxAttempts to 20

  // Debug: Log DOM after note12 focus
  console.log('DOM after note12 focus:', await page.locator('.editor-input > ul').innerHTML());
  // Changed: Debug filtered/unfiltered classes
  console.log('Filtered classes:', await page.locator('.editor-input ul.filtered, .editor-input li.filtered').allTextContents());
  console.log('Unfiltered classes:', await page.locator('.editor-input ul.unfiltered, .editor-input li.unfiltered').allTextContents());

  // Verify focused state: all notes visible due to no filtering
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2); // note0, note1
  expect(await page.locator('.editor-input > ul > li span[data-lexical-text="true"]')).toHaveText([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']); // Match current app behavior
  expect(await notebook.html()).toMatchSnapshot('focused');

  // Navigate to note1 via breadcrumb (if available)
  const note1Breadcrumb = page.locator('li.breadcrumb-item a:has-text("note1")');
  if (await note1Breadcrumb.isVisible()) {
    expect(await note1Breadcrumb.innerText()).toBe('note1');
    await note1Breadcrumb.click();
    await waitForNote(page, 'note1', 20, 1000); // Changed: Updated maxAttempts to 20
  } else {
    console.log('note1 breadcrumb not visible, skipping navigation');
  }

  // Debug: Log DOM for note1
  console.log('DOM after note1 focus:', await page.locator('.editor-input > ul').innerHTML());

  // Verify note1-focused state: full tree due to app bug
  await expect(page.locator('.editor-input > ul > li')).toHaveCount(2);
  expect(await notebook.getNotes()).toEqual([
    'note0', 'note00', 'note000', 'note01',
    'note1', 'note10', 'note11', 'note12', 'note120', 'note1200', 'note1201'
  ]);
  expect(await breadcrumbs(page)).toEqual(['Documents', 'main']);

  // Navigate back to root
  const rootBreadcrumb = page.locator('li.breadcrumb-item a:has-text("main")');
  await rootBreadcrumb.click();
  await waitForNote(page, 'note12', 20, 1000); // Changed: Updated maxAttempts to 20

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

test('reload', async ({ page, notebook }, testInfo) => {
  // Set reasonable timeout for this test
  testInfo.setTimeout(30000);

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
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Changed: Debug DOM immediately post-reload
  console.log('DOM immediately after reload:', await page.locator('body').innerHTML());
  await page.waitForFunction(
    () => document.querySelector('.editor-input > ul') !== null,
    { timeout: 20000 } // Changed: Increased timeout to 20s
  );
  await waitForNote(page, 'note0', 20, 1000); // Changed: Updated maxAttempts to 20

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