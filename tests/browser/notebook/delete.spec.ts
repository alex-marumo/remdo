import { test } from "./common";
import { expect } from "@playwright/test";

test("backspace at the beginning of a note", async ({ page, notebook }) => {
  await notebook.load("basic");
  await notebook.selectNote("note00");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");

  const state = await notebook.state();
  const ids = state.map(n => n.id);

  expect(ids).not.toContain("note00");

  expect(await notebook.html()).toMatchSnapshot();
});

test("backspace at the beginning of a note after a folded note", async ({
  page,
  menu,
  notebook,
}) => {
  await notebook.load("tree");
  await menu.open("note0");
  await menu.fold();

  await notebook.clickBeginningOfNote("note1");
  await page.keyboard.press("Backspace");

  const state = await notebook.state();
  const ids = state.map(n => n.id);

  expect(ids).not.toContain("note1");

  expect(await notebook.html()).toMatchSnapshot();
});

test("backspace at the beginning of a folded note after another folded one", async ({
  page,
  menu,
  notebook,
}) => {
  await notebook.load("tree");
  await menu.open("note0");
  await menu.fold();
  await menu.open("note1");
  await menu.fold();

  await notebook.clickBeginningOfNote("note1");
  await page.keyboard.press("Backspace");

  const state = await notebook.state();
  const ids = state.map(n => n.id);

  expect(ids).not.toContain("note1");

  expect(await notebook.html()).toMatchSnapshot();
});

// FIXME: Add this next!
test.skip("delete folded notes", async ({ page, notebook }) => {
  // we'll implement this next
});
