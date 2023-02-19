//breaks if lexical-playground dependencies are installed
import { test, expect } from "@playwright/test";
import {
  assertHTML,
  clearEditor,
  focusEditor,
  getHTML,
  html,
  prettifyHTML,
} from "../../lexical/packages/lexical-playground/__tests__/utils/index.mjs";
import { getNote } from "./index";

// eslint-disable-next-line no-unused-vars
async function logHTML(page) {
  const html = await getHTML(page);
  console.log(prettifyHTML(html));
}

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await focusEditor(page);
  await clearEditor(page);

  await page.keyboard.type("note1");
  await page.keyboard.press("Enter");
  await page.keyboard.type("note2");
  await page.keyboard.press("Enter");
  await page.keyboard.type("note3");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Notes/);
});

test("clear content", async ({ page }) => {
  await page.locator("text=Clear").click();
  await assertHTML(
    page,
    html`
      <ul>
        <li value="1"><br /></li>
      </ul>
    `
  );
});

test("content", async ({ page }) => {
  await assertHTML(
    page,
    html`
      <ul>
        <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
        <li value="2" dir="ltr"><span data-lexical-text="true">note2</span></li>
        <li value="3" dir="ltr"><span data-lexical-text="true">note3</span></li>
      </ul>
    `
  );
});

test("indent outdent", async ({ page }) => {
  const expectedHTMLBase = await getHTML(page);

  //select note2
  await getNote(page, "note2").selectText();

  //indent
  await page.keyboard.press("Tab");
  const expectedHTMLIndented = html`
    <ul>
      <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
      <li value="2" class="position-relative li-nested">
        <ul>
          <li value="1" dir="ltr">
            <span data-lexical-text="true">note2</span>
          </li>
        </ul>
      </li>
      <li value="2" dir="ltr"><span data-lexical-text="true">note3</span></li>
    </ul>
  `;

  await assertHTML(page, expectedHTMLIndented);

  //indent second time the same note with no effect
  await page.keyboard.press("Tab");
  await assertHTML(page, expectedHTMLIndented);

  //outdent
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await assertHTML(page, expectedHTMLBase);

  //outdent second time with no effect
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await assertHTML(page, expectedHTMLBase);
});

test("create empty notes", async ({ page }) => {
  await getNote(page, "note3").selectText();

  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await assertHTML(
    page,
    html`
      <ul>
        <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
        <li value="2" dir="ltr"><span data-lexical-text="true">note2</span></li>
        <li value="3"><br /></li>
        <li value="4"><br /></li>
        <li value="5"><br /></li>
      </ul>
    `
  );
});

test("menu follows selection", async ({ page }) => {
  const note = getNote(page, "note2");
  await note.selectText();
  const noteBB = await note.boundingBox();
  const menu = page.locator("#hovered-note-menu");
  const menuBB = await menu.boundingBox();
  const menuCenter = menuBB.y + menuBB.height / 2;

  //check if the center of the menu icon is somwhere between top and bottom of selected note
  expect(menuCenter).toBeGreaterThanOrEqual(noteBB.y);
  expect(menuCenter).toBeLessThanOrEqual(noteBB.y + noteBB.height);

  //make sure that the menu is not expanded, then expand and collapse it
  expect(await menu.locator("ul").count()).toEqual(0);
  await menu.click();
  expect(await menu.locator("ul").count()).toBeGreaterThan(0);
  await note.selectText();
  expect(await menu.locator("ul").count()).toEqual(0);
});

test.fixme("indent note with children", async ({ page }) => {
  //TODO get back to this once https://github.com/facebook/lexical/issues/2951 is fixed
  //alternatively revert previous formalList changes

  const expectedHTMLBase = await getHTML(page);

  //make note3 child of note2
  await getNote(page, "note3").selectText();
  await page.keyboard.press("Tab");

  //intent note2 to make sure that it's child follows the indentation
  await getNote(page, "note2").selectText();
  await page.keyboard.press("Tab");

  const expectedHTMLIndented = html`
    <ul>
      <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
      <li class="position-relative li-nested" value="2">
        <ul>
          <li value="1" dir="ltr">
            <span data-lexical-text="true">note2</span>
          </li>
        </ul>
      </li>
      <li value="2" dir="ltr"><span data-lexical-text="true">note3</span></li>
    </ul>
  `;

  await assertHTML(page, expectedHTMLIndented);

  //outdent
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await assertHTML(page, expectedHTMLBase);
});

test("change root", async ({ page }) => {
  //check breadcrumbs
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(1);
  await expect(page.locator("li.breadcrumb-item.active")).toContainText(
    "Document"
  );

  //make note3 child of note2
  await getNote(page, "note3").selectText();
  await page.keyboard.press("Tab");

  //focus on note2 and make sure that only it and it's child are visible
  const el = await page.$('ul > li :text("note2")');
  const box = await el.boundingBox();
  const preFocusHTML = await getHTML(page);

  //playwright locators don't support ::before pseudo element, so this is a workaround to click it
  await page.mouse.click(box.x - 1, box.y + box.height / 2);
  const html = await getHTML(page);
  expect(html).not.toContain("note1");
  expect(html).toContain("note2");

  //TODO uncomment once https://github.com/facebook/lexical/issues/2951 is fixed
  //alternatively revert previous formalList changes
  //expect(html).toContain("note3");

  //check breadcrumbs after changing root
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(2);
  await expect(page.locator("li.breadcrumb-item.active")).toContainText(
    "note2"
  );

  //go back to the root element
  await page.locator("li.breadcrumb-item a").click();
  await assertHTML(page, preFocusHTML);
});

test("search", async ({ page }) => {
  const searchInput = page.locator("#search");

  await searchInput.type("note");
  let html = await getHTML(page);
  expect(html).toContain("note1");
  expect(html).toContain("note2");
  expect(html).toContain("note3");

  await searchInput.type("2");
  html = await getHTML(page);
  expect(html).not.toContain("note1");
  expect(html).toContain("note2");
  expect(html).not.toContain("note3");
});
