import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
} from "@lexical/list";
import {
  $getNearestNodeFromDOMNode,
  $getRoot,
  $isDecoratorNode,
  RootNode,
} from "lexical";
import { nanoid } from "nanoid";
import { mergeLists } from "./lexicalUnexported";

//copied, unexported function from lexical/packages/lexical-rich-text/src/index.ts
export function $isTargetWithinDecorator(target: HTMLElement): boolean {
  const node = $getNearestNodeFromDOMNode(target);
  return $isDecoratorNode(node);
}

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

globalThis.remdoGenerateNoteID = () => {
  return nanoid(8);
};

