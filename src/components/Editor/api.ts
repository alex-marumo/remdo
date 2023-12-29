import "lexical";
import { LexicalNode } from "@lexical/LexicalNode";
import { getActiveEditor, getActiveEditorState } from "@lexical/LexicalUpdates";
import { $getNodeByKeyOrThrow, getElementByKeyOrThrow } from "@lexical/LexicalUtils";
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
} from "@lexical/list";
import { ListNode, ListItemNode as LexicalListItemNode } from "@lexical/list";
import { findNearestListItemNode } from "@lexical/list/utils";
import {
  $getNodeByKey,
  $isTextNode,
  $createTextNode,
  EditorState,
  $getSelection,
  $isRangeSelection,
} from "lexical";

//TODO
//create folder api and split this to Note and NotesState

const ROOT_TEXT = "root";

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

//TODO explain the difference between NotesEditorState and NotesState
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

  get focusNote() {
    return new Note(this.focus?.nodeKey ?? "root");
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

  static documents(): string[] {
    return ["main"].concat(
      (import.meta as any).env.VITE_DOCUMENTS?.split(",").filter(Boolean) ?? []
    );
  }
}

export class Note {
  _lexicalKey: string;

  static from(keyOrNode: LexicalNode | string): Note {
    const baseNode =
      keyOrNode instanceof LexicalNode
        ? keyOrNode
        : $getNodeByKey(keyOrNode as string);
    const liNode = findNearestListItemNode(baseNode);

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
    const listNode = this._listNode(true).append(childNode);
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

  get parent(): Note {
    if (this.isRoot) {
      return null;
    }
    const lexicalParentNode = this.lexicalNode.getParent();
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
        .filter((child) => $isTextNode(child))
        .map((child) => child.getTextContent()),
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
    if (!parentList) {
      //this should never happen if the schema is correct
      //which doesn't mean it won't
      parent.lexicalNode
        .getParents()
        .find($isListItemNode)
        ?.insertAfter(this.lexicalNode);
    } else {
      parentList.getParent().insertAfter(this.lexicalNode);
    }
    if (list) {
      this.lexicalNode.insertAfter(list.getParentOrThrow());
    }
    if (parentList?.getChildrenSize() === 0) {
      parentList.getParentOrThrow().remove();
    }
  }

  moveDown() {
    const lexicalNode = this.lexicalNode;
    const childrenNode = this.hasChildren ? lexicalNode.getNextSibling() : null;
    let targetNode = (childrenNode || lexicalNode).getNextSibling();
    {
      //if targetNode has children, then instert after their node
      const targetNext = targetNode?.getNextSibling() as ListItemNode;
      targetNode =
        targetNext && isNestedLI(targetNext) ? targetNext : targetNode;
    }
    if (targetNode) {
      //moved node has next sibling node, let's swap them
      targetNode.insertAfter(lexicalNode);
    } else {
      //moved node is the last chilld of it's parent, so let's try to move it to parent's next sibling
      const newParent = this.parent.nextSibling;
      if (!newParent) return;
      const oldParentListNode = this.parent._listNode();
      newParent._listNode(true).splice(0, 0, [lexicalNode]);
      if (oldParentListNode.getChildrenSize() === 0) {
        //remove empty list node and it's parent (empty li)
        oldParentListNode.getParentOrThrow().remove();
      }
    }
    childrenNode && lexicalNode.insertAfter(childrenNode);
  }

  moveUp() {
    const lexicalNode = this.lexicalNode;
    const childrenNode = this.hasChildren ? lexicalNode.getNextSibling() : null;
    let targetNode = lexicalNode.getPreviousSibling() as ListItemNode;

    if (targetNode) {
      //previous node exists, let's insert before it
      targetNode = isNestedLI(targetNode)
        ? targetNode.getPreviousSibling()
        : targetNode;
      targetNode.insertBefore(lexicalNode);
    } else {
      //previous node doesn't exist, let's try to move it to parent's prev sibling
      const newParent = this.parent.prevSibling;
      if (!newParent) return;
      const oldParentListNode = this.parent._listNode();
      newParent._listNode(true).append(lexicalNode);
      if (oldParentListNode.getChildrenSize() === 0) {
        //remove empty list node and it's parent (empty li)
        oldParentListNode.getParentOrThrow().remove();
      }
    }
    childrenNode && lexicalNode.insertAfter(childrenNode);
  }

  focus() {
    NotesState.getActive().setFocus(this);
  }

  get folded() {
    return !this.isRoot && this.lexicalNode.getFolded();
  }

  //TODO add setFolded/getFolded to RootNode
  set folded(value: boolean) {
    if(!this.isRoot) {
      //TODO DOM manipulation should be done in createDOM
      //the problem is that folded note's children have display set to none
      //so they can be overwritten by Lexical reconciler
      getElementByKeyOrThrow(getActiveEditor(), this.lexicalKey).classList.remove("note-folded");
      this.lexicalNode.setFolded(value && this.hasChildren);
    }
  }

  setFoldLevel(level: number) {
    this._walk(
      (note, currentLevel) =>
        !note.isRoot && (note.folded = currentLevel === 0),
      level === 0 ? -1 : level
    );
  }

  get checked() {
    return !this.isRoot && this.lexicalNode.getChecked();
  }

  set checked(value) {
    !this.isRoot && this._walk((note) => note.lexicalNode.setChecked(value));
  }

  toggleChecked() {
    if (this.isRoot) {
      return;
    }
    const checked = !this.checked;
    this._walk((note) => note.lexicalNode.setChecked(checked));
  }

  get prevSibling() {
    //this methos is not symetric with nextSibling, but that's fine
    //the reason is that Note.from(nestedLI) will return note from parent node
    const sibling = this.lexicalNode.getPreviousSibling();
    return sibling ? Note.from(sibling) : null;
  }

  get nextSibling() {
    const sibling = this.hasChildren
      ? this.lexicalNode.getNextSibling()?.getNextSibling()
      : this.lexicalNode.getNextSibling();
    return sibling ? Note.from(sibling) : null;
  }

  _walk(
    walker: (node: Note, currentLevel: number) => void,
    level: number = -1
  ) {
    walker(this, level);
    if (level === 0) {
      return;
    }
    for (const child of this.children) {
      child._walk(walker, level - 1);
    }
  }
}

//TODO move somewhere else
declare module "@lexical/list" {
  interface ListItemNode {
    getFolded(): boolean;
    setFolded(value: boolean): void;
    __folded: boolean | null;
  }
}

LexicalListItemNode.prototype.getFolded = function () {
  return this.getLatest().__folded;
};

LexicalListItemNode.prototype.setFolded = function (value: boolean): void {
  this.getWritable().__folded = !!value;
};

export function getNotesFromSelection() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return [];
  }
  //TODO add support for multiple selection
  return [Note.from(selection.focus.key)];
}
