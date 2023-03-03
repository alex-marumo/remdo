import { Locator, Page } from "playwright";

export function getNote(page: Page, text: string): Locator {
  return page.locator(".editor-input li :text('" + text + "')");
}
