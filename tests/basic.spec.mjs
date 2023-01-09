import { test, expect } from '@playwright/test';
//TODO breaks if lexical-playground dependencies are installed
import { assertHTML, clearEditor, focusEditor, html } from '../lexical/packages/lexical-playground/__tests__/utils/index.mjs';

async function generateContent(page) {
  await focusEditor(page);
  await clearEditor(page);

  await page.keyboard.type('note1');
  await page.keyboard.press('Enter');
  await page.keyboard.type('note2');
  await page.keyboard.press('Enter');
  await page.keyboard.type('note3');
  await page.keyboard.press('Enter');
  await page.keyboard.type('note4');
  await page.keyboard.press('Enter');
  await page.keyboard.type('note5');
}

test('has title', async ({ page }) => {
  await page.goto('');

  await expect(page).toHaveTitle(/Notes/);
});

/*
test('clear content', async ({ page }) => {
  await page.goto('/');

  await click(page, ".btn-primary")
  await page.getByRole('button', { name: 'Clear' }).click();
  await assertHTML(
    page,
    html`
    <ul><li value="1"><br /></li></ul>
    `,
  );
});
*/

test('generate content', async ({ page }) => {
  await page.goto('');

  await generateContent(page);
  await assertHTML(
    page,
    html`
    <ul>
        <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
        <li value="2" dir="ltr"><span data-lexical-text="true">note2</span></li>
        <li value="3" dir="ltr"><span data-lexical-text="true">note3</span></li>
        <li value="4" dir="ltr"><span data-lexical-text="true">note4</span></li>
        <li value="5" dir="ltr"><span data-lexical-text="true">note5</span></li>
       </ul>
    `,
  );
  /*
  await assertHTML(
    page,
    html`
    <p class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr" dir="ltr"><span data-lexical-text="true">note1</span></p><p class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr" dir="ltr"><span data-lexical-text="true">note2</span></p><p class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr" dir="ltr"><span data-lexical-text="true">note3</span></p><p class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr" dir="ltr"><span data-lexical-text="true">note4</span></p><p class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr" dir="ltr"><span data-lexical-text="true">note5</span></p>
    `,
  );
  */
});

/*
test('indent outdent', async ({ page }) => {
  const IS_COLLAB = process.env.E2E_EDITOR_MODE === 'rich-text-with-collab';
  console.log("sample", IS_COLLAB);

  await page.goto('/split/?isCollab=true&collabEndpoint=ws://athena:8080');

  await generateContent(page);
  //const note = await page.getby
});
*/