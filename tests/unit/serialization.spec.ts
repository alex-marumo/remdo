/**
 * These are not real tests, but rather helpers to load/save the editor state
 * to/from file using command line.
 */
import "./common";
import { lexicalStateKeyCompare, loadEditorState } from "./common";
import fs from "fs";
import path from "path";
import { getDataPath } from "tests/common";
import { it, TestAPI } from "vitest";

const SERIALIZATION_FILE = process.env.VITEST_SERIALIZATION_FILE;

it.runIf(SERIALIZATION_FILE)("load", ({ editor }) => {
  const dataPath = getDataPath(SERIALIZATION_FILE);
  console.log();
  console.log();
  console.log("Loading from", dataPath);
  loadEditorState(editor, dataPath);
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
});
