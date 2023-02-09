import {
  describe,
  it,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  expect,
} from "vitest";
import React from "react";
import Editor from "../../src/Components/Editor";
import { Note } from "../../src/Components/Notes";
import { $getRoot, LexicalEditor } from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { render } from "@testing-library/react";
import type { LexicalNode, ElementNode } from "lexical";

declare module "vitest" {
  export interface TestContext {
    editor?: LexicalEditor;
  }
}

let _editor: LexicalEditor | null = null;

/** Runs test in Lexical editor update context */
function testUpdate(title: string, fn) {
  return it(title, context => {
    return context.editor.update(() => fn(context));
  });
}

beforeAll(async () => {
  function testHandler(editor) {
    _editor = editor;
  }
  const component = render(
    <div className="App">
      <Editor testHandler={testHandler} />
    </div>
  );

  let editorElement = component.getByRole("textbox");

  //wait for yjs to connect via websocket and init the editor content
  while (editorElement.children.length == 0) {
    await new Promise(r => setTimeout(r, 10));
  }
});

beforeEach(async context => {
  context.editor = _editor;
  context.editor.update(() => {
    $getRoot().clear();
  });
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});

describe("editor init", async () => {
  testUpdate("create notes", async () => {
    const rootNode = $getRoot();

    expect(rootNode.getChildrenSize()).toEqual(1);
    expect(rootNode.getChildren()[0]).toSatisfy($isListNode);

    const listNode: ElementNode = rootNode.getFirstChild();
    expect(listNode.getChildrenSize()).toEqual(1);
    expect(listNode.getChildren()[0]).toSatisfy($isListItemNode);

    const liNode: ElementNode = listNode.getFirstChild();
    expect(liNode.getChildrenSize()).toBe(0);
  });
});

describe("API", async () => {
  testUpdate("create note", async () => {
    const note = Note.from($getRoot());
    expect(note.hasChildren).toBeTruthy();
    expect([...note.children][0]).toBeInstanceOf(Note);

    note.createChild();
    expect(note.hasChildren).toBeTruthy();
    expect([...note.children].length).toEqual(2);
    expect([...note.children][1]).toBeInstanceOf(Note);
  });
});
