import {
  ElementNode,
  $getNodeByKey,
  $isTextNode,
  $createTextNode,
  EditorState,
} from "lexical";
import { LexicalNode } from "@lexical/LexicalNode";
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
  ListItemNode,
} from "@lexical/list";
import { ListNode, ListItemNode as LexicalListItemNode } from "@lexical/list";
import { $getNodeByKeyOrThrow } from "@lexical/LexicalUtils";
import { findNearestListItemNode } from "@lexical/list/utils";
import { getActiveEditor, getActiveEditorState } from "@lexical/LexicalUpdates";
//TODO
//create folder api and split this to Note and NotesState

const ROOT_TEXT = "Document";

interface NotesEditorState extends EditorState {
  _notesFilterChanged?: boolean;
}

export function getNotesEditorState() {
  return getActiveEditorState() as NotesEditorState;
}

export function isNestedLI(liNode: ListItemNode) {
  return liNode.getKey() === "root"
    ? false
    : liNode.getChildren().some($isListNode);
}

export class NotesState {
  _element: HTMLElement;
  _focus: null | { nodeKey: string; parentKey: string };

  constructor(element: HTMLElement) {
    this._element = element;
    this._readFocus();
  }

  get focus() {
    return this._focus;
  }

  _readFocus() {
    const focusNodeKey = this._element.dataset.focusNodeKey;
    this._focus =
      !focusNodeKey || focusNodeKey === "root"
        ? null
        : {
            nodeKey: focusNodeKey,
            parentKey: this._element.dataset.focusParentKey,
          };
  }

  _forceLexicalUpdate() {
    getNotesEditorState()._notesFilterChanged = true;
  }

  setFocus(note: Note) {
    //change notes state
    this._element.dataset.focusNodeKey = note.lexicalKey;
    this._element.dataset.focusParentKey = note.lexicalNode
      .getParent()
      ?.getKey();
    this._readFocus();
    this._forceLexicalUpdate();
  }

  setFilter(filter: string) {
    this._element.dataset.filter = filter;
    this._forceLexicalUpdate();
  }

  get filter() {
    return this._element.dataset.filter;
  }

  static getActive() {
    return new NotesState(getActiveEditor()._rootElement);
  }
}

export class Note {
  _lexicalKey: string;
  _lexicalNode: ElementNode;

  static from(keyOrNode: LexicalNode | string): Note {
    let baseNode =
      keyOrNode instanceof LexicalNode
        ? keyOrNode
        : $getNodeByKey(keyOrNode as string);
    let liNode = findNearestListItemNode(baseNode);

    if (!liNode) {
      return new Note("root");
    }
    return isNestedLI(liNode)
      ? new Note(liNode.getPreviousSibling()?.getKey() || liNode.getKey())
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

  get lexicalNode(): LexicalListItemNode {
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
          if (!isNestedLI(child as LexicalListItemNode)) {
            yield Note.from(child);
          }
          child = child.getNextSibling();
        }
      },
    };
  }

  _listNode(createIfNeeded = false): ListNode | null {
    if (this.isRoot) {
      return this.lexicalNode.getChildren().find($isListNode) as ListNode;
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

  indent() {
    if (!this.lexicalNode.getPreviousSibling()) {
      return;
    }
    const prevSibling = this.lexicalNode.getPreviousSibling();
    const prevNote = Note.from(prevSibling);
    const prevListNode = prevNote._listNode(true);
    const listNode = this._listNode();
    prevListNode.append(this.lexicalNode);
    if (listNode) {
      //li <- this.lexicalNode
      //li <- listNode.getParent if exists should be moved with this.lexicalNode
      //  ul <-listNode
      this.lexicalNode.insertAfter(listNode.getParent());
    }
  }

  outdent() {
    const parent = this.parent;
    if (this.isRoot || parent.isRoot) {
      return;
    }
    const list = this._listNode();
    const parentList = parent._listNode();
    parentList.getParent().insertAfter(this.lexicalNode);
    if (list) {
      this.lexicalNode.insertAfter(list.getParentOrThrow());
    }
    if (parentList.getChildrenSize() === 0) {
      parentList.getParentOrThrow().remove();
    }
  }

  moveDown() {
    const lexicalNode = this.lexicalNode;
    let nextNode = lexicalNode.getNextSibling();
    if (!nextNode) {
      return;
    }
    const listNode = this._listNode();
    if (listNode) {
      //if this has some children (which implies having listNode) then we have to go one node down
      nextNode = nextNode.getNextSibling();
      if (!nextNode) {
        return;
      }
    }
    nextNode.insertAfter(lexicalNode);
    if (listNode) {
      lexicalNode.insertAfter(listNode.getParentOrThrow());
    }
  }

  moveUp() {
    const lexicalNode = this.lexicalNode;
    let prevNode = lexicalNode.getPreviousSibling();
    if (!prevNode) {
      return;
    }
    const listNode = this._listNode();
    prevNode.insertBefore(lexicalNode);
    if (listNode) {
      lexicalNode.insertAfter(listNode.getParentOrThrow());
    }
  }

  focus() {
    NotesState.getActive().setFocus(this);
  }

  get fold() {
    if (this.isRoot) {
      //TODO
      return false;
    }
    return this.lexicalNode.getFold();
  }

  set fold(value) {
    !this.isRoot && this.lexicalNode.setFold(value);
  }
}

//TODO move somewhere else
declare module "@lexical/list" {
  interface ListItemNode {
    getFold(): boolean;
    setFold(fold: boolean): void;
    __fold: boolean | null;
  }
}

LexicalListItemNode.prototype.getFold = function () {
  return this.getLatest().__fold;
};

LexicalListItemNode.prototype.setFold = function (fold: boolean): void {
  this.getWritable().__fold = !!fold;
};
