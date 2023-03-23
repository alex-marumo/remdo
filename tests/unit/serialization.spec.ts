import "./common";
import { getDataPath, loadEditorStateFromFile } from "./common";
import fs from "fs";
import path from "path";
import { it } from "vitest";

function getDataFileName() {
  return path.basename(process.env.VITEST_SERIALIZATION_FILE);
}

it("save", ({ editor }) => {
  const dataPath = getDataPath(getDataFileName());
  console.log("Saving to", dataPath);
  const editorState = editor.getEditorState();
  const json = JSON.stringify(editorState, null, 2);
  fs.writeFileSync(dataPath, json);
});

it("load", ({ editor }) => {
  loadEditorStateFromFile(editor, getDataFileName());
});
