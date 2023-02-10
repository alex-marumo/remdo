import {
  ElementNode,
  $getNodeByKey,
  $isTextNode,
  $createTextNode,
} from "lexical";
import { LexicalNode } from "@lexical/LexicalNode";
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
} from "@lexical/list";
import type { ListNode, ListItemNode } from "@lexical/list";
import { $getNodeByKeyOrThrow } from "@lexical/LexicalUtils";
import { findNearestListItemNode } from "@lexical/list/utils";

const ROOT_TEXT = "Home";

function _isNested(liNode: ElementNode) {
  //mind that root is also treated as nested note
  return liNode.getChildren().some(child => $isListNode(child));
}

export class Note {
  _lexicalKey: string;
  _lexicalNode: ElementNode;

  static from(keyOrNode: LexicalNode | string) {
    let baseNode =
      keyOrNode instanceof LexicalNode
        ? keyOrNode
        : $getNodeByKey(keyOrNode as string);
    let liNode = findNearestListItemNode(baseNode);

    if (!liNode) {
      return new Note("root");
    }
    return _isNested(liNode)
      ? new Note(liNode.getPreviousSibling().getKey())
      : new Note(liNode.getKey());
  }

  constructor(key: string) {
    this._lexicalKey = key;
  }

  createChild(text = null): Note {
    const childNode = $createListItemNode();
    let listNode = this._listNode(true).append(childNode);
    if (text) {
      childNode.append($createTextNode(text));
    }
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
        while (child) {
          if (!_isNested(child as ListItemNode)) {
            yield Note.from(child);
          }
          child = child.getNextSibling();
        }
      },
    };
  }

  _listNode(createIfNeeded = false): ListNode | null {
    if (this.isRoot) {
      return this.lexicalNode.getFirstChild();
    }
    // li <- this._lexicalNode
    // li.li-nested
    //   ul <- searched list node
    let listNode = this.lexicalNode
      .getNextSibling()
      ?.getChildren()
      .find($isListNode);
    if (!listNode && createIfNeeded) {
      const liNode = $createListItemNode();
      this.lexicalNode.insertAfter(liNode);
      listNode = $createListNode("bullet");
      liNode.append(listNode);
    }
    return listNode;
  }

  get text() {
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

  canIndent() {
    return !!this.lexicalNode.getPreviousSibling();
  }

  indent() {
    if (this.canIndent()) {
      const prevSibling = this.lexicalNode.getPreviousSibling();
      const prevNote = Note.from(prevSibling);
      prevNote._listNode(true).append(this.lexicalNode);
    }
  }

  moveDown() {
    const nextNode = this.lexicalNode.getNextSibling()
    if(nextNode) {
        nextNode.insertAfter(this.lexicalNode);
    }
  }
}
