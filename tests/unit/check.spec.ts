import { getMinimizedState, loadEditorState } from "./common";
import { it } from "vitest";

//FIXME use toEqual instead of trying to name snapshots
it("check/uncheck", async ({ editor, expect, lexicalUpdate }) => {
  const notes = loadEditorState(editor, "single");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => (notes.note0.checked = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("checked");

  lexicalUpdate(() => (notes.note0.checked = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});

it("toggle check", async ({ editor, expect, lexicalUpdate }) => {
  const notes = loadEditorState(editor, "single");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => notes.note0.toggleChecked());
  expect(getMinimizedState(editor)).toMatchSnapshot("checked");

  lexicalUpdate(() => notes.note0.toggleChecked());
  expect(getMinimizedState(editor)).toMatchSnapshot("unchecked");
});

it("check/uncheck recursively", async ({
  editor,
  expect,
  lexicalUpdate,
}) => {
  const notes = loadEditorState(editor, "basic");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => (notes.note0.checked = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("checked");

  lexicalUpdate(() => (notes.note0.checked = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});

it("toggle check recursively", async ({
  editor,
  expect,
  lexicalUpdate,
}) => {
  const notes = loadEditorState(editor, "basic");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => notes.note0.toggleChecked());
  expect(getMinimizedState(editor)).toMatchSnapshot("checked");

  lexicalUpdate(() => notes.note0.toggleChecked());
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});
