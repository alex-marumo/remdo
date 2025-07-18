import { test } from './common'; 
import { expect } from '@playwright/test';
test('add the first child to note with existing children', async ({ notebook, page }) => { 
  // Load notebook with basic tree structure 
  await notebook.load('basic');
// Verify initial state: two top-level notes, note0 exists 
  const note0 = page.locator('.editor-input ul > li:has(span[data-lexical-text="true"]:text-is("note0"))').first(); 
  await expect(note0).toBeVisible(); 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(2); 
  expect(
    await notebook.getNotes()).toEqual(['note0', 'note1']); 
  expect(await notebook.html()).toMatchSnapshot('basic-initial');
// Click end of note0, add child with Enter 
  await notebook.clickEndOfNote('note0'); 
  await page.keyboard.press('Enter');
// Verify child added: note0 has one child, top-level unchanged 
  await expect(note0.locator('ul > li')).toHaveCount(1); 
  await expect(note0.locator('ul > li span[data-lexical-text="true"]')).toHaveText(''); 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(2); 
  expect(await notebook.html()).toMatchSnapshot('basic-child'); });
test('create some empty notes', async ({ page, notebook }) => { 
  // Load notebook with flat list of three notes 
  await notebook.load('flat');
// Verify initial state: three notes (note0, note1, note2) 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(3); 
  expect(await page.locator('.editor-input ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2']); 
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2']); 
  expect(await notebook.html()).toMatchSnapshot('flat-initial');
// Select note2, add two empty notes with Enter 
  await notebook.selectNote('note2'); 
  await page.keyboard.press('Enter'); 
  await page.keyboard.press('Enter');
// Verify two new empty notes added 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(5); 
  expect(await page.locator('.editor-input ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2', '', '']); 
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2', '', '']); 
  expect(await notebook.html()).toMatchSnapshot('flat-two-empty'); });
test('split note', async ({ page, notebook }) => { // Load notebook with flat list of three notes 
  await notebook.load('flat');
// Verify initial state: three notes (note0, note1, note2) 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(3); 
  expect(await page.locator('.editor-input ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'note1', 'note2']); 
  expect(await notebook.getNotes()).toEqual(['note0', 'note1', 'note2']); 
  expect(await notebook.html()).toMatchSnapshot('flat-initial');
// Click end of note1, move cursor left twice, split with Enter 
  await notebook.clickEndOfNote('note1'); 
  await page.keyboard.press('ArrowLeft'); 
  await page.keyboard.press('ArrowLeft'); 
  await page.keyboard.press('Enter');
// Verify note1 split into "not" and "e1" 
  await expect(page.locator('.editor-input ul > li')).toHaveCount(4); 
  expect(await page.locator('.editor-input ul > li span[data-lexical-text="true"]')).toHaveText(['note0', 'not', 'e1', 'note2']); 
  expect(await notebook.getNotes()).toEqual(['note0', 'not', 'e1', 'note2']); 
  expect(await notebook.html()).toMatchSnapshot('flat-split'); });
