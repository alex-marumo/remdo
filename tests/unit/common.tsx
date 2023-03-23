import App from "@/App";
import { NotesLexicalEditor } from "@/components/Editor/lexical/NotesComposerContext";
import { Note } from "@/components/Editor/lexical/api";
import { TestContext as ComponentTestContext } from "@/components/Editor/plugins/DevComponentTestPlugin";
import {
  BoundFunctions,
  getAllByRole,
  queries,
  render,
  RenderResult,
  within,
} from "@testing-library/react";
import fs from "fs";
import { $getRoot, CLEAR_HISTORY_COMMAND } from "lexical";
import { LexicalEditor } from "lexical";
import path from "path";
import React from "react";
import { it, afterAll, expect, beforeEach, afterEach } from "vitest";

declare module "vitest" {
  export interface TestContext {
    _component: RenderResult;
    queries: BoundFunctions<
      typeof queries & { getAllNotNestedIListItems: typeof getAllByRole.bind }
    >;
    lexicalUpdate: (fn: () => void) => void;
    editor: NotesLexicalEditor;
    expect: typeof expect;
  }
}

/**
 * Modified version of vitest-preview debug function
 * to save the file in a different location
 */
export function debug() {
  const CACHE_FOLDER = path.join(process.cwd(), "data", ".vitest-preview");
  //content directly copied from vitest-preview to change the cache folder
  function createCacheFolderIfNeeded() {
    if (!fs.existsSync(CACHE_FOLDER)) {
      fs.mkdirSync(CACHE_FOLDER, {
        recursive: true,
      });
    }
  }

  function debug() {
    createCacheFolderIfNeeded();
    fs.writeFileSync(
      path.join(CACHE_FOLDER, "index.html"),
      document.documentElement.outerHTML
    );
  }
  //end of copied code
  debug();
}

/** Runs test in Lexical editor update context */
export function testUpdate(
  title: string,
  fn: ({ root, context, rootNode }) => void,
  // eslint-disable-next-line @typescript-eslint/ban-types
  runner: Function = it
) {
  if (fn.constructor.name == "AsyncFunction") {
    throw Error("Async functions can't be wrapped with update");
  }
  return runner(title, context => {
    context.lexicalUpdate(() => {
      const rootNode = $getRoot();
      fn({ context, root: Note.from(rootNode), rootNode });
    });
    debug();
  });
}

testUpdate.only = (title: string, fn) => {
  testUpdate(title, fn, it.only);
};

testUpdate.skip = (title: string, fn) => {
  testUpdate(title, fn, it.skip);
};

//TODO consider changing that function to accept structure parameter like that:
//    const structure = checkStructure(root, {
//  root: {
//    note0,
//    note1: {
//      note2,
//    },
//  },
//});
//in such a case ids would not be available, but these can be compared to text
//or just skipped
export function checkChildren(
  notes: Array<Note>,
  expectedChildrenArrays: Array<Array<Note>>
) {
  let expectedCount = 0;
  notes.forEach((note, idx) => {
    const expectedChildren = expectedChildrenArrays[idx] || [];
    expectedCount += expectedChildren.length;
    //note.text and idx are added in case of an error, so it's easier to notice which node causes the issue
    expect([note.text, idx, ...note.children]).toStrictEqual([
      note.text,
      idx,
      ...expectedChildren,
    ]);
    expect(note.hasChildren).toEqual(expectedChildren.length > 0);
    for (const child of note.children) {
      expect(child).toBeInstanceOf(Note);
    }
  });
  expect(notes).toHaveLength(expectedCount + 1); //+1 for root which is not listed as a child
}

export function createChildren(
  note: Note,
  count: number
): [Array<Note>, ...Note[]] {
  const start = [...note.children].length;
  for (let i = 0; i < count; ++i) {
    note.createChild(`note${start + i}`);
  }
  const n: Array<Note> = [note, ...note.children];
  const n1: Array<Note> = [...note.children];

  return [n, ...n1];
}

export function getDataPath(name: string) {
  return path.join(__dirname, "..", "data", name + ".json");
}

export function loadEditorStateFromFile(editor: LexicalEditor, name: string) {
  const dataPath = getDataPath(name);
  console.log("Loading from", dataPath);
  const serializedEditorState = fs.readFileSync(dataPath).toString();
  const editorState = editor.parseEditorState(serializedEditorState);
  editor.setEditorState(editorState);
  editor.dispatchCommand(CLEAR_HISTORY_COMMAND, null);
}

/** put children at the end */
export function lexicalStateKeyCompare(a: any, b: any) {
  if (a === "children") {
    return 1;
  }
  if (b === "children") {
    return -1;
  }
  return a.localeCompare(b);
}

beforeEach(async context => {
  function testHandler(editor: NotesLexicalEditor) {
    context.editor = editor;
  }

  //TODO test only editor, without router, layout, etc. required editor to abstract from routes
  const component = render(
    <ComponentTestContext.Provider value={{ testHandler }}>
      <h1 className="text-center text-warning">Unit tests</h1>
      <App />
    </ComponentTestContext.Provider>
  );

  const editorElement = component.getByRole("textbox");

  context._component = component;
  context.queries = within(editorElement, {
    ...queries,
    getAllNotNestedIListItems: () =>
      context.queries
        .getAllByRole("listitem")
        .filter(li => !li.classList.contains("li-nested")),
  });

  context.lexicalUpdate = updateFunction => {
    let err = null;
    context.editor.fullUpdate(
      function () {
        try {
          return updateFunction();
        } catch (e) {
          err = e;
        }
      },
      { discrete: true }
    );
    if (err) {
      //rethrow after finishing update
      throw err;
    }
  };

  if (!process.env.VITE_DISABLECOLLAB) {
    //wait for yjs to connect via websocket and init the editor content
    while (editorElement.children.length == 0) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
});

afterEach(async context => {
  if (!process.env.VITE_DISABLECOLLAB) {
    //an ugly workaround - to give a chance for yjs to sync
    await new Promise(r => setTimeout(r, 10));
  }
  context._component.unmount();
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});
