import {
  ElementNode,
  $getNodeByKey,
  $isTextNode,
  $createTextNode,
  EditorState,
  LexicalEditor,
  EditorConfig,
} from "lexical";
import { LexicalNode } from "@lexical/LexicalNode";
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
} from "@lexical/list";
import type { ListNode, ListItemNode } from "@lexical/list";
import {
  $getNodeByKeyOrThrow,
  $getRoot,
} from "@lexical/LexicalUtils";
import { findNearestListItemNode } from "@lexical/list/utils";
import { getActiveEditor, getActiveEditorState } from "@lexical/LexicalUpdates";
import { $isStateNode, StateNode } from "./lexicalNodes/StateNode";

const ROOT_TEXT = "Document";

interface NotesEditorState extends EditorState {
  _notesFilter?: Function;
}

export function getNotesEditorState() {
  return getActiveEditorState() as NotesEditorState;
}

function _isNested(liNode: ElementNode) {
  //mind that root is also treated as nested note
  return liNode.getChildren().some($isListNode);
}

export function getState(): StateNode {
  return $getRoot().getChildren().find($isStateNode) as StateNode;
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
    this._focus = !focusNodeKey
      ? null
      : {
          nodeKey: focusNodeKey,
          parentKey: this._element.dataset.focusParentKey,
        };
  }

  setFocus(note: Note) {
    this._element.dataset.focusNodeKey = note.lexicalKey;
    this._element.dataset.focusParentKey = note.lexicalNode
      .getParent()
      ?.getKey();
    this._readFocus();
  }

  setFilter(filter: string) {
    this._element.dataset.filter = filter;
  }

  get filter() {
    return this._element.dataset.filter;
  }

  static getActive() {
    return new NotesState(getActiveEditor()._rootElement);
  }

  lexicalUpdateDOM(
    node: LexicalNode,
    lexicalMethod: Function,
    _prevNode: unknown,
    _dom: HTMLElement,
    _config: EditorConfig
  ) {
    //TODO double check if lexicalMethod is bound
    //lexicalMethod has to be placed first as it may have some side effects
    return lexicalMethod(_prevNode, _dom, _config) || this.focus || this.filter;
  }

  lexicalCreateDOM(
    node: LexicalNode,
    lexicalMethod: Function,
    _config: EditorConfig,
    _editor: LexicalEditor
  ) {
    //
    // search filter
    //
    if (this.filter && !Note.from(node).text.includes(this.filter)) {
      return document.createElement("div");
    }

    //
    // focus
    //
    const focus = this.focus;
    //console.log("node: ", node.__key, Note.from(node).lexicalKey);
    if (
      !focus ||
      focus.parentKey === node.getKey() ||
      focus.nodeKey === node.getKey() ||
      //TODO explain why
      (note =>
        [note, ...note.parents].some(
          p => p.lexicalKey === focus.nodeKey
          //console.log(p.lexicalKey, focus.nodeKey)
        ))(Note.from(node))
    ) {
      return lexicalMethod(_config, _editor);
    } else {
      return document.createElement("div");
    }
  }
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
    const nextNode = this.lexicalNode.getNextSibling();
    if (nextNode) {
      nextNode.insertAfter(this.lexicalNode);
    }
  }

  focus() {
    NotesState.getActive().setFocus(this);
  }
}
