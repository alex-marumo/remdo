import { debug, getMinimizedState, loadEditorState } from "./common";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createParagraphNode, $getRoot } from "lexical";
import { it } from "vitest";

it("empty", async ({ editor, expect, lexicalUpdate }) => {
  const state = getMinimizedState(editor);
  expect(state).toMatchSnapshot();
});

it("single list - correct", async ({ editor, expect, lexicalUpdate }) => {
  lexicalUpdate(() => {
    const root = $getRoot();
    //root is cleared already in beforeEach, but after that it's the tested root
    //node transform listener is called, so we need to clear it again
    root.clear();
    const listNode = $createListNode("bullet");
    const listItemNode = $createListItemNode();
    listNode.append(listItemNode);
    root.append(listNode);
  });
  const state = getMinimizedState(editor);
  expect(state).toMatchSnapshot();
});

it("multiple lists", async ({ editor, expect, lexicalUpdate }) => {
  lexicalUpdate(() => {
    const root = $getRoot();
    //in total 3 lists as one is added automatically by the tested root node 
    //transform listener
    for (let i = 0; i < 2; i++) {
      const listNode = $createListNode("bullet");
      const listItemNode = $createListItemNode();
      listNode.append(listItemNode);
      root.append(listNode);
    }
  });
  const state = getMinimizedState(editor);
  expect(state).toMatchSnapshot();
});
