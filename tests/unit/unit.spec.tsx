import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  afterEach,
  TestContext,
} from "vitest";
import React from "react";
import App from "../../src/App";
import { Note } from "../../src/api";
import { $getRoot, LexicalEditor } from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { render, RenderResult } from "@testing-library/react";
import type { LexicalNode, ElementNode } from "lexical";
import { TestContext as ComponentTestContext } from "../../src/plugins/ComponentTest";
import { debug } from 'vitest-preview';

declare module "vitest" {
  export interface TestContext {
    component?: RenderResult;
    editor?: LexicalEditor;
  }
}

/** Runs test in Lexical editor update context */
function testUpdate(title: string, fn) {
  if (fn.constructor.name == "AsyncFunction") {
    throw Error("Async functions can't be wrapped with update");
  }
  return it(title, context => {
    context.editor.update(() => {
      $getRoot().clear();
    });
    //this is intentionally a separate update to make sure that editor state will be fixed by appropriate listener
    return context.editor.update(() => {
      fn(context);
    });
  });
}

function logHTML(context: TestContext) {
  console.log(context.component);
}

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

function createChildren(note: Note, count: number): [Array<Note>, ...Note[]] {
  const start = [...note.children].length;
  for (let i = 0; i < count; ++i) {
    note.createChild(`note${start + i}`);
  }
  const n: Array<Note> = [note, ...note.children];
  const n1: Array<Note> = [...note.children];

  return [n, ...n1];
}

beforeEach(async context => {
  function testHandler(editor) {
    context.editor = editor;
  }
  //TODO test only editor, without router, layout, etc. required editor to abstract from routes
  const component = render(
    <ComponentTestContext.Provider value={{ testHandler }}>
      <h1 className="text-center text-warning">Unit tests</h1>
      <App />
    </ComponentTestContext.Provider>
  );

  context.component = component;

  let editorElement = component.getByRole("textbox");

  //wait for yjs to connect via websocket and init the editor content
  while (editorElement.children.length == 0) {
    await new Promise(r => setTimeout(r, 10));
  }
});

afterEach(async context => {
  context.component.unmount();
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});

it.skip("playground", (context) => {
  context.editor.update(() => {
    $getRoot().clear();
  });
  context.editor.update(() => {
    const root = Note.from($getRoot());
    const [notes, note0, note1, note2] = createChildren(root, 2);
  });
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

  /** creates N times M children in the root */
  it(
    "performance",
    async (context) => {
      const N = 2;
      const M = 2;
      context.editor.update(() => {
        $getRoot().clear();
      });
      for (let i = 0; i < N; ++i) {
        //console.log("i", i);
        context.editor.update(() => {
          const root = Note.from($getRoot());
          createChildren(root, M);
        });
        await new Promise(r => setTimeout(r, 10));
      }
    },
    60 * 1000
  );

  testUpdate("indent1", (context) => {
    const root = Note.from($getRoot());

    const [notes, note0, note1, note2] = createChildren(root, 2);
    note1.indent();
    note1.focus();

    debug();
  });
});
