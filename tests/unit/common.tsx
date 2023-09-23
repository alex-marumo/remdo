import { getDataPath } from "../common";
import Editor from "@/components/Editor";
import { NotesLexicalEditor } from "@/components/Editor/lexical/NotesComposerContext";
import { Note } from "@/components/Editor/lexical/api";
import { TestContext as ComponentTestContext } from "@/components/Editor/plugins/DevComponentTestPlugin";
import { Layout } from "@/components/Layout";
import {
  BoundFunctions,
  getAllByRole,
  queries,
  render,
  RenderResult,
  within,
} from "@testing-library/react";
import { NodeSnapshotEnvironment } from "@vitest/snapshot/environment";
import fs from "fs";
import yaml from "js-yaml";
import { $getRoot, CLEAR_HISTORY_COMMAND } from "lexical";
import { LexicalEditor } from "lexical";
import path from "path";
import React from "react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { afterAll, expect, beforeEach, afterEach } from "vitest";

/* 
 vitest saves file snapshots in the same folder as the test file
 this monkey patch changes the behavior to save them in a __snapshots__ folder
 which is more inline with regular snapshots, playwright file snapshots
 plus in general makes more sense
 the problem with regular vitest shapshots is that they reside in a single
 file which disables syntax highlighting and on top of that naming them is
 misleading, because two snapshots with the same name
 can have totaly different content and reside next to each other
 */
NodeSnapshotEnvironment.prototype.resolveRawPath = function (
  testPath: string,
  rawPath: string
): Promise<string> {
  //currentTestName gives result like this: tests/unit/fold.spec.ts > fold all
  //the idea is to get only the actual name (i.e. "fold all")
  //and then replace all non-alphanumeric characters with a hyphen
  const testNameWithFile = expect.getState().currentTestName;
  const sub = " > ";
  const testName = testNameWithFile
    .slice(testNameWithFile.indexOf(sub) + sub.length)
    .replace(/[^a-zA-Z0-9]/g, "-");

  const snapshotPath = path.join(
    path.dirname(testPath),
    "__snapshots__",
    path.basename(testPath),
    `${testName}_${rawPath}`
  );
  return Promise.resolve(snapshotPath); //noop, just to avoid type errors
};

declare module "vitest" {
  export interface TestContext {
    component: RenderResult;
    queries: BoundFunctions<
      typeof queries & { getAllNotNestedIListItems: typeof getAllByRole.bind }
    >;
    lexicalUpdate: (fn: () => void) => void;
    load: (name: string) => Record<string, Note>;
    log: (message: string) => void;
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

expect.addSnapshotSerializer({
  //Custom serializer for LexicalEditor objects
  serialize(val: any): string {
    //skipping most of serialize arguments as they are not needed here
    return getMinimizedState(val);
  },
  test(val) {
    return val && val.getEditorState;
  },
});

/**
 * converts editor state to YAML with removed defaults for easier reading and
 * comparison, used for saving snapshots
 */
function getMinimizedState(editor: LexicalEditor) {
  type Node = Array<Node> | object;
  const SKIP = null; //marker in default table that means that the particular key should be skipped regardless of the value

  function walk(node: Node) {
    function minimize(node: object) {
      const defaults = {
        list: {
          direction: "ltr",
          format: "",
          indent: 0,
          listType: "bullet",
          start: 1,
          tag: "ul",
          version: 1,
        },
        listitem: {
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
          checked: false,
          folded: false,
          value: SKIP,
        },
        text: {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: "",
          version: 1,
        },
        undefined: {},
        root: {
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        },
      };

      const d = defaults[node["type"]];
      if (!d) {
        throw new Error("No defaults for " + node["type"]);
      }
      for (const key in node) {
        if (node[key] === null || node[key] === d[key] || d[key] === SKIP) {
          delete node[key];
        }
      }
    }

    if (
      ["number", "string", "boolean"].includes(typeof node) ||
      node === null
    ) {
      return;
    } else if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        walk(node[i]);
      }
    } else if (node instanceof Object) {
      minimize(node);
      for (const key in node) {
        walk(node[key]);
      }
    } else {
      throw new Error(`Unexpected node: ${node} type: ${typeof node}`);
    }
  }
  const editorState = editor.getEditorState();
  const state = JSON.parse(JSON.stringify(editorState)); // clone deeply
  walk(state);

  return yaml.dump(state, {
    noArrayIndent: true,
    sortKeys: lexicalStateKeyCompare,
  });
}

beforeEach(async (context) => {
  const LOG_FILE_PATH = path.join(process.cwd(), "data", "test.log");
  fs.writeFileSync(LOG_FILE_PATH, "", "utf8");

  function testHandler(editor: NotesLexicalEditor) {
    context.editor = editor;
  }

  //lexical/node_modules causes YJS to be loaded twice and leads to issues
  expect(fs.existsSync("lexical/node_modules")).toBeFalsy();

  const routerEntries = ["/"];
  const serializationFile = process.env.VITEST_SERIALIZATION_FILE;
  if (serializationFile) {
    const fileName = path.basename(serializationFile);
    console.log(fileName);
    routerEntries.push(`/?documentID=${fileName}`);
  }

  //TODO test only editor, without router, layout, etc. required editor to abstract from routes
  const component = render(
    <ComponentTestContext.Provider value={{ testHandler }}>
      <MemoryRouter initialEntries={routerEntries}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route element={<Editor />}>
              <Route path="" element="</>" index></Route>
              <Route path="note/:noteID" element="</>"></Route>
            </Route>
            <Route path="about" element={<div>About</div>} />
            <Route path="*" element={<Navigate to="/" />}></Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </ComponentTestContext.Provider>
  );

  const editorElement = component.getByRole("textbox");

  context.component = component;
  context.queries = within(editorElement, {
    ...queries,
    getAllNotNestedIListItems: () =>
      context.queries
        .getAllByRole("listitem")
        .filter((li) => !li.classList.contains("li-nested")),
  });

  /**
   * loads editor state from a file with the given @name
   * @returns a record of all notes in the editor, with their text in
   * camelCase as keys
   */
  context.load = function (name: string) {
    type Notes = Record<string, Note>;

    function toCamelCase(str: string): string {
      return str
        .trim()
        .toLowerCase()
        .replace(/(\s+)(\w)/g, (_, __, letter) => letter.toUpperCase());
    }

    function walk(note: Note, notes: Notes) {
      notes[toCamelCase(note.text)] = note;
      for (const child of note.children) {
        walk(child, notes);
      }
    }

    const dataPath = getDataPath(name);
    const serializedEditorState = fs.readFileSync(dataPath).toString();
    const editorState = context.editor.parseEditorState(serializedEditorState);
    context.editor.setEditorState(editorState);
    context.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, null);
    const notes: Notes = {};
    context.editor.update(() => {
      walk(Note.from($getRoot()), notes);
    });
    return notes;
  };

  context.lexicalUpdate = (updateFunction) => {
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

  context.log = function (...args: any[]) {
    const formattedArgs = args
      .map((arg) => {
        if (typeof arg === "object") {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(" ");
    const formattedMessage = `${new Date().toISOString()} - ${formattedArgs}\n`;

    fs.appendFileSync(LOG_FILE_PATH, formattedMessage);
    console.log(formattedMessage);
  };

  if (!process.env.VITE_DISABLECOLLAB) {
    //wait for yjs to connect via websocket and init the editor content
    let i = 0;
    const waitingTime = 10;
    while (editorElement.children.length == 0) {
      if ((i += waitingTime) % 1000 === 0) {
        console.log(`waiting for yjs to load some data - ${i}ms`);
        //console.log(editorElement.outerHTML)
      }
      await new Promise((r) => setTimeout(r, waitingTime));
    }
  }
  if (!serializationFile && !process.env.VITE_PERFORMANCE_TESTS) {
    //clear the editor's content before each test
    //except for the serialization, where potentially we may want to save the
    //current content or performance where some of the tests should be stateful
    //it's important to do it here once collab is already initialized
    context.lexicalUpdate(() => {
      const root = $getRoot();
      root.clear();
    });
  }
});

afterEach(async (context) => {
  debug();
  if (!process.env.VITE_DISABLECOLLAB) {
    //an ugly workaround - to give a chance for yjs to sync
    await new Promise((r) => setTimeout(r, 10));
  }
  context.component.unmount();
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise((r) => setTimeout(r, 10));
});
