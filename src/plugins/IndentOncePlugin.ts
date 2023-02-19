import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { Note } from "../api"; //TODO

export function isIndentPermitted() {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }

  const nodesInSelection = selection.getNodes();
  const note = Note.from(nodesInSelection[0]);
  return note.canIndent();
}

export default function IndentOncePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => !isIndentPermitted(),
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);
  return null;
}
