import { test } from "./common";
import { expect } from "@playwright/test";

test("focus on a particular note", async ({ page, notebook }) => {
  await notebook.load("tree_complex");
  //check breadcrumbs
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(1);
  await expect(page.locator("li.breadcrumb-item")).toContainText("main");

  expect(await notebook.html()).toMatchSnapshot("unfocused");

  //focus on note12 and make sure that only it and it's child are visible
  //playwright locators don't support ::before pseudo element, so this is a workaround to click it
  const noteBox = await notebook.noteLocator("note12").boundingBox();
  await page.mouse.click(noteBox.x - 1, noteBox.y + noteBox.height / 2);

  expect(await notebook.html()).toMatchSnapshot("focused");
  //check breadcrumbs after changing root
  await expect(page.locator("li.breadcrumb-item")).toHaveCount(3);
  await expect(page.locator("li.breadcrumb-item.active")).toContainText(
    "note12"
  );

  //FIXME this part fails withoth collab as the notebooks state is lost whenever a page is reloaded
  //ideally breadcrumbs should not reload page at all
  //go back to the root element
  //await page.locator("li.breadcrumb-item a").click();
  //await notebook.noteLocator("note12").waitFor();
  //expect(await notebook.html()).toMatchSnapshot("unfocused");
});
