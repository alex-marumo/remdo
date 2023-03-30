import { getMinimizedState, loadEditorState } from "./common";
import { it } from "vitest";

//TODO add support for named snapshots
//FIXME use toEqual instead of trying to name snapshots
it("fold", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "basic");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
  lexicalUpdate(() => (note0.folded = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("folded");

  lexicalUpdate(() => (note0.folded = true)); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("folded");

  lexicalUpdate(() => (note0.folded = false));
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
});

it("load folded", async ({ editor, expect }) => {
  const { note0 } = loadEditorState(editor, "folded");
  expect(getMinimizedState(editor)).toMatchSnapshot();
});

it("modify folded", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "folded");
  lexicalUpdate(() =>
    note0.lexicalNode.getFirstChild().setTextContent("note0 - modified")
  );
  expect(getMinimizedState(editor)).toMatchSnapshot();
});

it("fold to a specific level", async ({
  editor,
  expect,
  lexicalUpdate,
}) => {
  const { root, note0, note1 } = loadEditorState(editor, "tree_complex");
  const base = getMinimizedState(editor);
  expect(base).toMatchSnapshot("base");

  lexicalUpdate(() => root.setFoldLevel(1));
  const folded1 = getMinimizedState(editor);
  expect(folded1).toMatchSnapshot("folded1");

  lexicalUpdate(() => root.setFoldLevel(2));
  const folded2 = getMinimizedState(editor);
  expect(folded2).toMatchSnapshot("folded2");

  lexicalUpdate(() => root.setFoldLevel(3));
  const folded3 = getMinimizedState(editor);
  expect(folded3).toMatchSnapshot("folded3");

  lexicalUpdate(() => root.setFoldLevel(4));
  const folded4 = getMinimizedState(editor);
  expect(folded4).toMatchSnapshot("folded4");

  lexicalUpdate(() => root.setFoldLevel(9));
  expect(getMinimizedState(editor)).toEqual(folded4);

  lexicalUpdate(() => root.setFoldLevel(0));
  expect(getMinimizedState(editor)).toEqual(folded4);

  lexicalUpdate(() => root.setFoldLevel(1));
  lexicalUpdate(() => root.setFoldLevel(0));
  expect(getMinimizedState(editor)).toEqual(folded4);
});
