import { findNearestListItemNode } from "@lexical/list/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
} from "lexical";
import { useEffect } from "react";

export function isIndentPermitted() {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }

  const nodesInSelection = selection.getNodes();
  const listItemNode = findNearestListItemNode(nodesInSelection[0])
  const listNode = listItemNode.getParent();
  return !listItemNode.is(listNode.getFirstChild());
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
