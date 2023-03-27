import { getMinimizedState, loadEditorState } from "./common";
import { it } from "vitest";

it("fold", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "basic");
  expect(getMinimizedState(editor)).toMatchSnapshot("base");
  lexicalUpdate(() => (note0.fold = true));
  expect(getMinimizedState(editor)).toMatchSnapshot("folded");

  lexicalUpdate(() => (note0.fold = true)); //noop
  expect(getMinimizedState(editor)).toMatchSnapshot("folded");

  lexicalUpdate(() => (note0.fold = false));
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
