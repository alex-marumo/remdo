import { getMinimizedState, loadEditorState } from "./common";
import { it } from "vitest";

//FIXME use toEqual instead of trying to name snapshots
it("reorder flat", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "flat");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => note0.moveDown());
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down");

  lexicalUpdate(() => note0.moveDown());
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down x2");

  lexicalUpdate(() => note0.moveDown()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down x2");

  lexicalUpdate(() => note0.moveUp());
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down");

  lexicalUpdate(() => note0.moveUp());
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => note0.moveUp()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});

it("reorder tree", async ({ editor, expect, lexicalUpdate }) => {
  const { note0, subNote0 } = loadEditorState(editor, "tree");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => note0.moveDown());
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down");

  lexicalUpdate(() => note0.moveDown()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("note0 down");

  lexicalUpdate(() => note0.moveUp());
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => note0.moveUp()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => subNote0.moveUp()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("base");

  lexicalUpdate(() => subNote0.moveDown()); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});
