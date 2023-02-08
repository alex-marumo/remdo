import { assert, describe, expect, it, vi } from "vitest";
import React from "react";
import Editor from "../../src/Components/Editor";
import { Note } from "../../src/Components/Notes";
import { $getRoot } from "lexical";
import { render } from "@testing-library/react";

globalThis.testUpdateListener = function (editor) {
  console.log("in update listener");
  console.log(
    $getRoot()
      .getAllTextNodes()
      .map(node => node.getTextContent())
      .join(", ")
  );
  console.log(Note.create($getRoot()).lexicalKey);
};

vi.mock("react-dom", () => ({
  ...vi.importActual("react-dom"),
  createPortal: node => node,
}));

async function render_editor() {
  const component = render(
    <div className="App">
      <Editor testHandler={msg => console.log("test handler", msg)} />
    </div>
  );
  do {
    await new Promise(r => setTimeout(r, 10));
  } while (
    component.container.querySelector("div.editor-input").children.length == 0
  );
  return component;
}

describe("suite name", async () => {
  it("rtl", async () => {
    const component = await render_editor();
    console.log("rtl");
    console.log(
      "log1: ",
      component.container.querySelector("div.editor-input").children.length
    );
    await new Promise(r => setTimeout(r, 10));
    expect(2+2).toBe(4);
  });
});
