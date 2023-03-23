import {
  assertHTML,
  clearEditor,
  getEditorHTML,
  html,
} from "./common";
import { getNoteLocator } from "./common";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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
  const expectedHTMLBase = await getEditorHTML(page);

  //select note2
  await getNoteLocator(page, "note2").selectText();
  await page.locator(".editor-input li :text('note2')").selectText();

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

test("indent outdent with children", async ({ page }) => {
  //make note 3 child of note2
  await getNoteLocator(page, "note3").selectText();
  await page.keyboard.press("Tab");
  const expectedHTML1 = await getEditorHTML(page);

  //indent note2
  await getNoteLocator(page, "note2").selectText();
  await page.keyboard.press("Tab");

  const expectedHTMLIndented = html`
    <ul>
      <li value="1" dir="ltr"><span data-lexical-text="true">note1</span></li>
      <li value="2" class="position-relative li-nested">
        <ul>
          <li value="1" dir="ltr">
            <span data-lexical-text="true">note2</span>
          </li>
          <li value="2" class="position-relative li-nested">
            <ul>
              <li value="1" dir="ltr">
                <span data-lexical-text="true">note3</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  `;

  await assertHTML(page, expectedHTMLIndented);

  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await assertHTML(page, expectedHTML1);
});

test("create empty notes", async ({ page }) => {
  await getNoteLocator(page, "note3").selectText();

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

test.fixme("menu follows selection", async ({ page }) => {
  const note = getNoteLocator(page, "note2");
  await note.selectText();
  const noteBB = await note.boundingBox();
  const menu = page.locator("#hovered-note-menu");
  const menuBB = await menu.boundingBox();
  const menuCenter = menuBB.y + menuBB.height / 2;

  //check if the center of the menu icon is somewhere between top and bottom of selected note
  expect(menuCenter).toBeGreaterThanOrEqual(noteBB.y);
  expect(menuCenter).toBeLessThanOrEqual(noteBB.y + noteBB.height);

  //make sure that the menu is not expanded, then expand and collapse it
  expect(await menu.locator("ul").count()).toEqual(0);
  await menu.click();
  expect(await menu.locator("ul").count()).toBeGreaterThan(0);
  await note.selectText();
  //expect(await menu.locator("ul").count()).toEqual(0); //TODO
});

test("change root", async ({ page }) => {
  //check breadcrumbs
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(1);
  await expect(page.locator("li.breadcrumb-item.active")).toContainText(
    "Document"
  );

  //make note3 child of note2
  await getNoteLocator(page, "note3").selectText();
  await page.keyboard.press("Tab");

  //focus on note2 and make sure that only it and it's child are visible
  const el = await page.$("ul > li :text('note2')");
  const box = await el.boundingBox();
  const preFocusHTML = await getEditorHTML(page);

  //playwright locators don't support ::before pseudo element, so this is a workaround to click it
  await page.mouse.click(box.x - 1, box.y + box.height / 2);
  const html = await getEditorHTML(page);
  expect(html).not.toContain("note1");
  expect(html).toContain("note2");
  expect(html).toContain("note3");

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
  let html = await getEditorHTML(page);
  expect(html).toContain("note1");
  expect(html).toContain("note2");
  expect(html).toContain("note3");

  await searchInput.type("2");
  html = await getEditorHTML(page);
  expect(html).not.toContain("note1");
  expect(html).toContain("note2");
  expect(html).not.toContain("note3");
});

async function prepareMenu(page) {
  //TODO move to a separate file and use before/after each
  const menuLocator = page.locator("#quick-menu");
  await expect(menuLocator).toHaveCount(0);

  await getNoteLocator(page, "note3").selectText();
  await page.keyboard.press("Tab");
  expect(await getEditorHTML(page)).toContain("note3");

  await getNoteLocator(page, "note2").selectText();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift");
  await page.waitForTimeout(10);
  await page.keyboard.press("Shift");
  return menuLocator;
}

async function checkMenu(page) {
  expect(await getEditorHTML(page)).not.toContain("note3"); //folded
}

test("quick menu", async ({ page }) => {
  const menuLocator = await prepareMenu(page);
  await expect(menuLocator).toHaveCount(1);
  await expect(menuLocator).toContainText("Press a key...");
  await expect(menuLocator.locator("li.list-group-item")).not.toHaveCount(0);
  await expect(menuLocator.locator("li.list-group-item.active")).toHaveCount(0);

  await page.keyboard.press("ArrowDown");
  await expect(
    menuLocator.locator("li.list-group-item.active")
  ).not.toHaveCount(0);

  await page.keyboard.press("Enter"); //blindly assuming that the first option is fold
  await checkMenu(page);
});

test("quick menu - hot key", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("f"); //fold

  expect(await getEditorHTML(page)).not.toContain("note3"); //folded
});

test("quick menu - click", async ({ page }) => {
  const menuLocator = await prepareMenu(page);
  await page.locator("#quick-menu button :text('Fold')").click();
  await checkMenu(page);
});

test("quick menu - arrows + enter", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await checkMenu(page);
});

test("quick menu - arrows + hot key", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");

  await page.keyboard.press("f"); //fold

  await checkMenu(page);
});

test("quick menu - esc", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("Escape");

  expect(await getEditorHTML(page)).toContain("note3"); //not folded
  expect(await getEditorHTML(page)).not.toContain(",,");
});

test("quick menu - backspace", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("Backspace");

  expect(await getEditorHTML(page)).toContain("note3"); //not folded
  expect(await getEditorHTML(page)).not.toContain(",,");
});

test("quick menu - invalid hot key", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("$");

  expect(await getEditorHTML(page)).toContain("note3"); //not folded
  expect(await getEditorHTML(page)).not.toContain(",,");
});


test("screen", async ({ page }) => {
  await page.locator("text='Hide Debug'").click();
  await expect(page).toHaveScreenshot();
});

//FIXME add a test for deleting folded notes
//FIXME test clicking outside of the menu
