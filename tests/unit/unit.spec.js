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

describe("suite name", async () => {
  it("rtl", async () => {
    console.log("rtl");
    let component = render(
      <div className="App">
        <Editor testHandler={msg => console.log("test handler", msg)} />
      </div>
    );
    do {
      await new Promise(r => setTimeout(r, 10));
    } while (
      component.container.querySelector("div.editor-input").children.length == 0
    );
    console.log(
      "log1: ",
      component.container.querySelector("div.editor-input").children.length
    );
    await new Promise(r => setTimeout(r, 10));
  });
});
