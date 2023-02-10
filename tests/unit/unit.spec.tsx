import { describe, it, beforeAll, afterAll, expect } from "vitest";
import React from "react";
import Editor from "../../src/components/Editor";
import { Note } from "../../src/api";
import { $getRoot, LexicalEditor } from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { render } from "@testing-library/react";
import type { LexicalNode, ElementNode } from "lexical";

let _editor: LexicalEditor | null = null;

/** Runs test in Lexical editor update context */
function testUpdate(title: string, fn) {
  if (fn.constructor.name == "AsyncFunction") {
    throw Error("Async functions can't be wrapped with update");
  }
  return it(title, context => {
    getActiveEditor().update(() => {
      $getRoot().clear();
    });
    //this is intentionally a separate update to make sure that editor state will be fixed by appropriate listener
    return getActiveEditor().update(() => {
      fn(context);
    });
  });
}

//TODO consider using vitest API
function checkChildren(
  notes: Array<Note>,
  expectedChildrenArrays: Array<Array<Note>>
) {
  let expectedCount = 0;
  notes.forEach((note, idx) => {
    const expectedChildren = expectedChildrenArrays[idx] || [];
    expectedCount += expectedChildren.length;
    expect([...note.children]).toStrictEqual(expectedChildren);
    expect(note.hasChildren).toEqual(expectedChildren.length > 0);
    for (let child of note.children) {
      expect(child).toBeInstanceOf(Note);
    }
  });
  expect(notes).toHaveLength(expectedCount + 1); //+1 for root which is not listed as a child
}

function getActiveEditor() {
  return _editor;
}

function createChildren(note: Note, count: number): [Array<Note>, ...Note[]] {
  const start = [...note.children].length;
  for (let i = 0; i < count; ++i) {
    note.createChild(`note${start + i}`);
  }
  const n: Array<Note> = [note, ...note.children];
  const n1: Array<Note> = [...note.children];

  return [n, ...n1];
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

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});

describe("editor init", async () => {
  testUpdate("create notes", () => {
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
  testUpdate("create notes", () => {
    const root = Note.from($getRoot());
    const note0 = [...root.children][0];
    const notes = [root, note0];

    checkChildren(notes, [[note0]]);

    const note1 = note0.createChild("note1");
    notes.push(note1);
    checkChildren(notes, [[note0], [note1]]);
    expect(note1.text).toEqual("note1");

    const note2 = note0.createChild();
    notes.push(note2);
    checkChildren(notes, [[note0], [note1, note2]]);
    expect(note2.text).toEqual("");
  });

  testUpdate("indent", () => {
    const root = Note.from($getRoot());

    expect([...root.children].length).toEqual(1);

    const [notes, note0, note1, note2] = createChildren(root, 2);
    checkChildren(notes, [[note0, note1, note2]]);

    note1.indent();
    checkChildren(notes, [[note0, note2], [note1]]);

    note1.indent(); //no effect
    checkChildren(notes, [[note0, note2], [note1]]);

    note2.indent();
    checkChildren(notes, [[note0], [note1, note2]]);

    note2.indent();
    checkChildren(notes, [[note0], [note1], [note2]]);

    note2.indent(); //no effect
    checkChildren(notes, [[note0], [note1], [note2]]);
  });

  testUpdate("move", () => {
    const root = Note.from($getRoot());

    const [notes, note0, note1, note2] = createChildren(root, 2);
    checkChildren(notes, [[note0, note1, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note0, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note2, note0]]);

    note0.moveDown(); // no effect
    checkChildren(notes, [[note1, note2, note0]]);
  });

  /** creates N times M children in a root */
  it("performance", async () => {
    const N = 2;
    const M = 2;
    getActiveEditor().update(() => {
      $getRoot().clear();
    });
    for (let i = 0; i < N; ++i) {
      console.log("i", i);
      getActiveEditor().update(() => {
        const root = Note.from($getRoot());
        createChildren(root, M);
      });
      await new Promise(r => setTimeout(r, 10));
    }
  });
  60 * 1000
});
