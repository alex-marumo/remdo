import {
  describe,
  it,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import React, { Component } from "react";
import Editor from "../../src/Components/Editor";
import { Note } from "../../src/Components/Notes";
import { $getRoot, LexicalEditor } from "lexical";
import { render } from "@testing-library/react";

let _editor = null;
let _component = null;

vi.mock("react-dom", () => ({
  ...vi.importActual("react-dom"),
  createPortal: node => node,
}));

beforeAll(async () => {
  function testHandler(editor) {
    _editor = editor;
  }
  _component = render(
    <div className="App">
      <Editor testHandler={testHandler} />
    </div>
  );

  //wait for yjs to connect via websocket and init the editor content
  while (
    _component.container.querySelector("div.editor-input").children.length == 0
  ) {
    await new Promise(r => setTimeout(r, 10));
  }
});

beforeEach(async context => {
  context.editor = _editor;
  context.component = _component;
});

afterAll(async () => {
  //an ugly workaround - otherwise we may loose some messages written to console
  await new Promise(r => setTimeout(r, 10));
});

describe("API", async () => {
  it("rtl", async context => {
    context.editor.update(() => {
      const note = Note.from($getRoot());
      console.log(note.lexicalKey);
      note.createChild();
    });
  });
});
