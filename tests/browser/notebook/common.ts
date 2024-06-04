import { test as base } from "../common";
import { Page, Locator } from "@playwright/test";
import fs from "fs";
import prettier from "prettier";
import { getDataPath } from "tests/common.js";

export class Notebook {
  constructor(private readonly page: Page) {}

  locator(selector="") {
    const editorSelector = ".editor-input" + (selector ? " " + selector : "");
    return this.page.locator(editorSelector);
  }

  noteLocator(title: string): Locator {
    return this.locator("li span:text-is('" + title + "')");
  }

  async load(file: string) {
    await this.page.click("text=Load State");
    const dataPath = getDataPath(file);
    const serializedEditorState = fs.readFileSync(dataPath).toString();
    await this.page.locator("#editor-state").fill(serializedEditorState);
    await this.page.click("text=Submit Editor State");
    await this.page.click("text=Load State");
    await this.locator().focus();

    //FIXME - wait for lexical to fully update the editor
    //perhabs the whole loading mechanism should be improved
    await this.page.waitForTimeout(200);
  }

  async html() {
    return prettier
      .format(await this.locator().innerHTML(), {
        //@ts-ignore
        attributeSort: "ASC",
        parser: "html",
      })
      .trim();
  }

  /** places cursor on the very end of given's note title */
  async clickEndOfNote(title: string) {
    const noteLocator = this.noteLocator(title);
    const { width, height } = await noteLocator.boundingBox();
    await noteLocator.click({
      position: { x: width - 1, y: height - 1 }, //the idea is that bottom right corner should be the end of the title's text
    });
  }

  async clickBeginningOfNote(title: string) {
    const noteLocator = this.noteLocator(title);
    await noteLocator.click({
      position: { x: 1, y: 1 }, 
    });
  }
}

class Menu {
  constructor(
    private readonly page: Page,
    private readonly notebook: Notebook
  ) {}

  locator(selector = "") {
    return this.page.locator(`#quick-menu ${selector}`.trim());
  }

  iconLocator() {
    return this.page.locator("#hovered-note-menu");
  }

  async open(noteText?: string) {
    if (noteText) {
      await this.notebook.noteLocator(noteText).selectText();
    }
    await this.page.waitForTimeout(20);
    await this.page.keyboard.press("Shift");
    await this.page.waitForTimeout(20);
    await this.page.keyboard.press("Shift");
    await this.page.waitForTimeout(20);
  }

  async fold() {
    await this.page.keyboard.press("f"); 
    await this.page.waitForTimeout(20);
  }
}

export let test = base.extend<{ notebook: Notebook}>({
  notebook: async ({ baseURL, page }, use) => {
    const notebook = new Notebook(page);
    await page.goto(baseURL);
    await notebook.locator().focus();
    await use(notebook);
  },
});

test = test.extend<{menu: Menu }>({
  menu: async ({ page, notebook }, use) => {
    await use(new Menu(page, notebook));
  },
});
