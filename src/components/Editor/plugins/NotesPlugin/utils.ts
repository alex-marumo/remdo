import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
} from "@lexical/list";
import {
  $getEditor,
  $getRoot,
  $setSelection,
  RootNode,
} from "lexical";
import { nanoid } from "nanoid";
import { FULL_RECONCILE, mergeLists } from "./lexicalUnexported";

/**
 *  forces the right editor structure:
 *  root
 *    ul
 *       ...
 */
export function $fixRoot(rootNode: RootNode) {
  const children = $getRoot().getChildren();
  if (children.length === 1 && $isListNode(children[0])) {
    return;
  }
  let listNode = children.find($isListNode);
  if (!listNode) {
    listNode = $createListNode("bullet");
    rootNode.append(listNode);
    const listItemNode = $createListItemNode();
    listItemNode.append(...children);
    listNode.append(listItemNode);
    listItemNode.select();
    return;
  }
  for (const child of children) {
    if (child === listNode) {
      continue;
    }
    if ($isListNode(child)) {
      mergeLists(listNode, child);
    } else if ($isListItemNode(child)) {
      listNode.append(child);
    } else {
      const listItemNode = $createListItemNode();
      listItemNode.append(child);
      listNode.append(listItemNode);
    }
  }
}

export function $setSearchFilter(filter: string) {
  const editor = $getEditor();
  editor._dirtyType = FULL_RECONCILE;
  editor._remdoState.setFilter(filter);
  $setSelection(null);
};

globalThis.remdoGenerateNoteID = () => {
  return nanoid(8);
};

