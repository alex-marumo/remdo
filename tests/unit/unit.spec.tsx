import { describe, it, afterAll, expect, beforeEach, afterEach, TestAPI, TestFunction } from "vitest";
import React from "react";
import App from "../../src/App";
import { Note, NotesState } from "../../src/api";
import { $createTextNode, $getRoot, $setSelection } from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import {
  BoundFunctions,
  getAllByRole,
  queries,
  render,
  RenderResult,
  within,
} from "@testing-library/react";
import type { ElementNode } from "lexical";
import { TestContext as ComponentTestContext } from "../../src/plugins/DevComponentTest";
import { FULL_RECONCILE } from "@lexical/LexicalConstants";
import fs from "fs";
import path from "path";

function debug() {
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

declare module "vitest" {
  export interface TestContext {
    _component?: RenderResult;
    queries?: BoundFunctions<
      typeof queries & { getAllNotNestedIListItems: typeof getAllByRole.bind }
    >;
    lexicalUpdate: (fn: () => void) => void;
  }
}

/** Runs test in Lexical editor update context */
function testUpdate(
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
function checkChildren(
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
  let editor = null;
  function testHandler(ed) {
    editor = ed;
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
    editor._dirtyType = FULL_RECONCILE;
    editor.update(
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

  context.lexicalUpdate(() => {
    $getRoot().clear();
  });
  //this have to be a separate, discrete update, so appropriate listener can
  //be fired afterwards and create the default root note
  context.lexicalUpdate(() => {
    $getRoot()
      .getChildren()
      .find($isListNode)
      .getFirstChildOrThrow()
      .append($createTextNode("note0"));

    //otherwise we can get some errors about missing functions in the used
    //DOM implementation
    $setSelection(null);
  });
});

afterEach(async context => {
  //an ugly workaround - to give a chance for yjs to sync
  await new Promise(r => setTimeout(r, 10));
  context._component.unmount();
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});

describe("editor init", async () => {
  testUpdate("create notes", ({ rootNode }) => {
    expect(rootNode.getChildrenSize()).toEqual(1);
    expect(rootNode.getChildren()[0]).toSatisfy($isListNode);

    const listNode: ElementNode = rootNode.getFirstChild();
    expect(listNode.getChildrenSize()).toEqual(1);
    expect(listNode.getChildren()[0]).toSatisfy($isListItemNode);

    const liNode: ElementNode = listNode.getFirstChild();
    expect(liNode.getChildrenSize()).toBe(1);
  });
});

describe("API", async () => {
  testUpdate("create notes", ({ root }) => {
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

  testUpdate("indent and outdent", ({ root }) => {
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

    note2.outdent();
    checkChildren(notes, [[note0], [note1, note2]]);

    note2.outdent();
    checkChildren(notes, [[note0, note2], [note1]]);

    note2.outdent(); //no effect
    checkChildren(notes, [[note0, note2], [note1]]);

    note1.outdent();
    checkChildren(notes, [[note0, note1, note2]]);
  });

  testUpdate("indent and out with children", ({ root }) => {
    expect([...root.children].length).toEqual(1);

    const [notes, note0, note1, note2, note3, note4] = createChildren(root, 4);
    checkChildren(notes, [[note0, note1, note2, note3, note4]]);

    note3.indent();
    checkChildren(notes, [[note0, note1, note2, note4], [], [], [note3]]);

    note2.indent();
    checkChildren(notes, [[note0, note1, note4], [], [note2], [note3]]);

    note2.outdent();
    checkChildren(notes, [[note0, note1, note2, note4], [], [], [note3]]);
  });

  testUpdate("move", ({ root }) => {
    const [notes, note0, note1, note2] = createChildren(root, 2);
    checkChildren(notes, [[note0, note1, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note0, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note2, note0]]);

    note0.moveDown(); // no effect
    checkChildren(notes, [[note1, note2, note0]]);
  });

  testUpdate("move down and up with children", ({ root }) => {
    const [notes, note0, note1, note2, note3] = createChildren(root, 3);
    checkChildren(notes, [[note0, note1, note2, note3]]);

    note1.indent(); //make note1 a child of note0
    const children0 = [[note0, note2, note3], [note1]];
    checkChildren(notes, children0);

    note0.moveDown(); //move note0 and it's child
    const children1 = [[note2, note0, note3], [note1]];
    checkChildren(notes, children1);

    note0.moveDown(); //do it again
    const children2 = [[note2, note3, note0], [note1]];
    checkChildren(notes, children2);

    note0.moveDown(); //do it again with no effect
    checkChildren(notes, children2);

    note0.moveUp();
    checkChildren(notes, children1);

    note0.moveUp();
    checkChildren(notes, children0);

    note0.moveUp(); //no effect
    checkChildren(notes, children0);
  });

  /** creates N times M children in the root */
  it(
    "performance",
    async context => {
      const N = 2;
      const M = 2;
      for (let i = 0; i < N; ++i) {
        //console.log("i", i);
        context.lexicalUpdate(() => {
          const root = Note.from($getRoot());
          createChildren(root, M);
        });
        //TODO test is it still needed with discrete === true
        await new Promise(r => setTimeout(r, 10));
      }
    },
    60 * 1000
  );

  it("focus", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());

      const [, , note1, note2] = createChildren(root, 3);
      note1.indent();
      note2.indent();
      note2.indent();
    });

    //note0, note1, note2, note3 (root doesn't count as it's a div not li)
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(4);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.focus();
    });

    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);
  });

  it("focus and add children", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.focus();
    });

    //note0
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(1);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.createChild("note1");
      root.createChild("note2");
    });

    //note0, note1
    //note2 should be filtered out as it's not a child of focused node
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(2);
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      root.focus();
    });
    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);
  });

  it("filter", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const notesState = NotesState.getActive();

      createChildren(root, 1);
      //filter that matches all notes
      notesState.setFilter("note");

      //to make sure that notes created after setting filter behave in the same way as already existing ones
      createChildren(root, 1);
    });

    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const notesState = NotesState.getActive();
      notesState.setFilter("note1");

      //to make sure that notes created after setting filter behave in the same way as already existing ones
      createChildren(root, 1);
    });

    debug();
    //note1
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(1);
  });

  it("fold", async context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const [notes, note0, note1, note2, note3] = createChildren(root, 3);
      note2.indent();
      note1.indent();
      note0.fold = true;
    });
    //TODO check visibility once folding changes rendering instead of just hiding via css
  });

  it.skip("focus and filter", null);

  it.skip("playground", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      //const note0 = [...root.children][0];
      createChildren(root, 3);
    });
  });
});
