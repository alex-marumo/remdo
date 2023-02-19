import {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from "@lexical/LexicalNode";
import { DecoratorNode, EditorConfig, LexicalEditor } from "lexical";

export class StateNode extends DecoratorNode<null> {
  //TODO explain the name
  __cachedText: { focusNodeKey?: string; focusNodeParentKey?: string }; 
  constructor(key?: NodeKey) {
    super(key);
    this.__cachedText = {};
  }
  static getType() {
    return "notes-state";
  }

  static clone(node: StateNode): StateNode {
    return new StateNode(node.__key);
  }

  static importJSON(serializedNode): StateNode {
    return new StateNode();
  }

  exportJSON(): SerializedLexicalNode {
    return { type: this.getType(), version: 1 };
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor) {
    return document.createElement("span");
  }

  updateDOM(
    _prevNode: unknown,
    _dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }
}

export function $createStateNode() {
  return new StateNode();
}

export function $isStateNode(node: LexicalNode) {
  return node instanceof StateNode;
}
