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
  page.on("console", message => {
    if (["warning", "error"].includes(message.type())) {
      console.error(`${message.type} inside the browser: `, message.text());
      throw Error(message.text());
    }
  });
  page.on("pageerror", err => {
    console.error("Error inside the browser: ", err.message);
    throw err;
  });

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

test("indent outdent with children", async ({ page }) => {
  //make note 3 child of note2
  await getNote(page, "note3").selectText();
  await page.keyboard.press("Tab");
  const expectedHTML1 = await getHTML(page);

  //indent note2
  await getNote(page, "note2").selectText();
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
  await getNote(page, "note3").selectText();
  await page.keyboard.press("Tab");

  //focus on note2 and make sure that only it and it's child are visible
  const el = await page.$("ul > li :text('note2')");
  const box = await el.boundingBox();
  const preFocusHTML = await getHTML(page);

  //playwright locators don't support ::before pseudo element, so this is a workaround to click it
  await page.mouse.click(box.x - 1, box.y + box.height / 2);
  const html = await getHTML(page);
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

async function prepareMenu(page) {
  //TODO move to a separate file and use before/after each
  const menuLocator = page.locator("#quick-menu");
  await expect(menuLocator).toHaveCount(0);

  await getNote(page, "note3").selectText();
  await page.keyboard.press("Tab");
  expect(await getHTML(page)).toContain("note3");

  await getNote(page, "note2").selectText();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift");
  await page.waitForTimeout(10);
  await page.keyboard.press("Shift");
  return menuLocator;
}

async function checkMenu(page) {
  expect(await getHTML(page)).not.toContain("note3"); //folded
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

  expect(await getHTML(page)).not.toContain("note3"); //folded
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

  expect(await getHTML(page)).toContain("note3"); //not folded
  expect(await getHTML(page)).not.toContain(",,");
});

test("quick menu - backspace", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("Backspace");

  expect(await getHTML(page)).toContain("note3"); //not folded
  expect(await getHTML(page)).not.toContain(",,");
});

test("quick menu - invalid hot key", async ({ page }) => {
  const menuLocator = await prepareMenu(page);

  await page.keyboard.press("$");

  expect(await getHTML(page)).toContain("note3"); //not folded
  expect(await getHTML(page)).not.toContain(",,");
});

//FIXME add a test for deleting folded notes
//FIXME test clicking outside of the menu
