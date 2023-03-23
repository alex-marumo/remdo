import "./common";
import { getDataPath, lexicalStateKeyCompare, loadEditorState } from "./common";
import fs from "fs";
import path from "path";
import { it } from "vitest";

function getDataFileName() {
  return path.basename(process.env.VITEST_SERIALIZATION_FILE);
}

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

it("save", ({ editor }) => {
  const dataPath = getDataPath(getDataFileName());
  console.log("Saving to", dataPath);
  const editorState = JSON.parse(JSON.stringify(editor.getEditorState()));
  const sortedJsonObj = sortObjectKeys(editorState);
  const sortedJson = JSON.stringify(sortedJsonObj, null, 2);

  fs.writeFileSync(dataPath, sortedJson);
});

it("load", ({ editor }) => {
  loadEditorState(editor, getDataFileName());
});
