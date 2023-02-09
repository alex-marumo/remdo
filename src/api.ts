import { ElementNode, $getNodeByKey, $isTextNode } from "lexical";
import { LexicalNode } from "@lexical/LexicalNode";
import {
  $isListItemNode,
  $createListItemNode,
  $createListNode,
  $isListNode,
} from "@lexical/list";
import type { ListNode } from "@lexical/list";
import { $getNodeByKeyOrThrow } from "@lexical/LexicalUtils";

function closestLINode(lexicalNode) {
  let node = lexicalNode;
  while (node !== null) {
    if ($isListItemNode(node)) {
      return node;
    }
    node = node.getParent();
  }
  return null;
}

const ROOT_TEXT = "Home";

export class Note {
  _lexicalKey: string;
  _lexicalNode: ElementNode;

  static from(keyOrNode: LexicalNode | string) {
    let baseNode =
      keyOrNode instanceof LexicalNode
        ? keyOrNode
        : $getNodeByKey(keyOrNode as string);
    let liNode = closestLINode(baseNode);

    if (!liNode) {
      return new Note("root");
    }
    return liNode.getChildren().some(child => $isListNode(child)) //nested
      ? new Note(liNode.getPreviousSibling().getKey())
      : new Note(liNode.getKey());
  }

  constructor(key: string) {
    this._lexicalKey = key;
  }

  createChild(): Note {
    const childNode = $createListItemNode();
    let listNode = this._listNode(true).append(childNode);
    return Note.from(childNode);
  }

  get isRoot(): boolean {
    return this.lexicalKey === "root";
  }

  get lexicalNode(): ElementNode {
    return $getNodeByKeyOrThrow(this._lexicalKey);
  }

  get lexicalKey() {
    return this._lexicalKey;
  }

  get parent() {
    if (this.isRoot) {
      return null;
    }
    let lexicalParentNode = this.lexicalNode.getParent();
    return Note.from(lexicalParentNode.getKey());
  }

  get parents() {
    const that = this;
    return {
      *[Symbol.iterator]() {
        let parent = that.parent;
        while (parent) {
          yield parent;
          parent = parent.parent;
        }
      },
    };
  }

  get hasChildren(): boolean {
    return this._listNode()?.getChildrenSize() > 0;
  }

  get children() {
    const that = this;
    return {
      *[Symbol.iterator]() {
        let child = that._listNode()?.getFirstChild();
        while (child !== null) {
          yield Note.from(child);
          child = child.getNextSibling();
        }
      },
    };
  }

  _listNode(createIfNeeded = false): ListNode | null {
    if (this.isRoot) {
      return this.lexicalNode.getFirstChild();
    }
    let listNode = this.lexicalNode.getNextSibling()?.getFirstChild(); // li.li-nested > ul
    if (!listNode && createIfNeeded) {
      const liNode = $createListItemNode();
      this.lexicalNode.insertAfter(liNode);
      listNode = $createListNode("bullet");
      liNode.append(listNode);
    }
    return listNode;
  }

  get plainText() {
    if (this.isRoot) {
      return ROOT_TEXT;
    }
    return [
      ...this.lexicalNode
        .getChildren()
        .filter(child => $isTextNode(child))
        .map(child => child.getTextContent()),
    ].join("");
  }

  indent() {
    throw Error("still in dev...");
  }
}
