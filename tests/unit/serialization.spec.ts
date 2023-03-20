import "./common";
import fs from "fs";
import { CLEAR_HISTORY_COMMAND } from "lexical";
import path from "path";
import { it } from "vitest";

function getDataPath() {
  const fileName = path.basename(
    `${process.env.VITEST_SERIALIZATION_FILE}.json`
  );
  return path.join(__dirname, "..", "data", fileName);
}

it("save", context => {
  const editorState = context.editor.getEditorState();
  const json = JSON.stringify(editorState, null, 2);
  const path = getDataPath();
  console.log("Saving to", path);
  fs.writeFileSync(path, json);
});

it("load", context => {
  const path = getDataPath();
  console.log("Loading from", path);
  const serializedEditorState = fs.readFileSync(path).toString();
  const initialEditorState = context.editor.parseEditorState(
    serializedEditorState
  );
  context.editor.setEditorState(initialEditorState);
  context.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, null);
});
