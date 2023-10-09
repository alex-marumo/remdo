import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useEffect } from "react";
import { Note } from "../api";

function indentOutdent(direction: "indent" | "outdent") {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }

  const nodesInSelection = selection.getNodes();
  const note = Note.from(nodesInSelection[0]);
  if(direction === "indent") {
    note.indent();
  }
  else {
    note.outdent();
  }
  
  return true;
}

export function IndentationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => indentOutdent("indent"),
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => indentOutdent("outdent"),
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor]);
  return null;
}
