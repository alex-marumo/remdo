import { Note } from "../api";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
} from "lexical";
import { useEffect } from "react";

function handleTab(event: KeyboardEvent) {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }
  event.preventDefault();

  const nodesInSelection = selection.getNodes();
  const note = Note.from(nodesInSelection[0]);
  if (event.shiftKey) {
    note.outdent();
  } else {
    note.indent();
  }

  return true;
}

export function IndentationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerCommand(KEY_TAB_COMMAND, handleTab, COMMAND_PRIORITY_LOW),
    [editor]
  );
  return null;
}
