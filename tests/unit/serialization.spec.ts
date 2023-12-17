/**
 * These are not real tests, but rather helpers to load/save the editor state
 * to/from file using command line.
 */
import { fireEvent, within } from "@testing-library/react";
import { getDataPath } from "../common";
import "./common";
import { lexicalStateKeyCompare } from "./common";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import fs from "fs";
import { it } from "vitest";

const SERIALIZATION_FILE = process.env.VITEST_SERIALIZATION_FILE;

it.runIf(SERIALIZATION_FILE)("load", async ({ load, component }) => {
  //console.log(component.container.querySelector("#notes-path a").map(e => e.textContent));
  //const documentSelector = component.getByTestId("document-selector");
  //console.log(documentSelector.innerHTML);
  //fireEvent.click(within(documentSelector).getByRole("button"));
  //console.log(documentSelector.innerHTML);
  //const option = await within(documentSelector).findByRole("link");
  //console.log(option.innerHTML);
  //return;
  //console.log(documentSelector.innerHTML);
  ////console.log(component.container.querySelector("#notes-path a").click());
  const dataPath = getDataPath(SERIALIZATION_FILE);
  console.log();
  console.log();
  console.log("Loading from", dataPath);
  load(dataPath);
});

it.runIf(SERIALIZATION_FILE)("save", ({ editor }) => {
  /**
   * uses lexicalStateKeyCompare to put children at the end for easier reading
   */
  function sortObjectKeys(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }

    const sortedObj: { [key: string]: any } = {};
    const sortedKeys = Object.keys(obj).sort(lexicalStateKeyCompare);

    for (const key of sortedKeys) {
      sortedObj[key] = sortObjectKeys(obj[key]);
    }

    return sortedObj;
  }

  const dataPath = getDataPath(SERIALIZATION_FILE);
  console.log("Saving to", dataPath);
  const editorState = JSON.parse(JSON.stringify(editor.getEditorState()));
  const sortedJsonObj = sortObjectKeys(editorState);
  const sortedJson = JSON.stringify(sortedJsonObj, null, 2);
  fs.writeFileSync(dataPath, sortedJson);

  const mdDataPath = dataPath.replace(/\.json$/, ".md");
  let markdown: string;
  editor.update(() => {
    markdown = $convertToMarkdownString(TRANSFORMERS);
  });
  console.log("Saving to", mdDataPath);
  fs.writeFileSync(mdDataPath, markdown);
});
