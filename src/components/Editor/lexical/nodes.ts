import { NotesState, Note, getNotesEditorState } from "./api";
import { patch } from "@/utils";
import {
  $createListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { addClassNamesToElement } from "@lexical/utils";
import { RangeSelection } from "lexical";

export function applyNodePatches(NodeType: any) {
  /*
    This function customizes updateDOM and createDOM (see below) in an existing
    lexical node class. An alternative would be to use lexical node replacement
    mechanism, but this turns off TextNode merging (see TextNote.isSimpleText()) 
    This could be fixed, but an additional benefit is that this method is 
    simpler, shorter (doesn't require to implement importJSON, clone, etc.)
    and doesn't rename original types
    */
  patch(NodeType, "updateDOM", function (oldMethod, prevNode, dom, config) {
    //lexicalMethod has to be placed first as it may have some side effects
    return (
      //TODO perform an actual check
      oldMethod(prevNode, dom, config) || true
    );
  });

  patch(NodeType, "createDOM", function (oldMethod, config, editor) {
    const notesState = NotesState.getActive();
    //
    // search filter
    //
    //TODO try to use "changeFocus" tag instead of changing state
    if (notesState.filter) {
      if ($isListNode(this)) {
        //TODO this could be specific for ListNode.createDOM
        if (this.getParent().getKey() === "root") {
          return oldMethod(config, editor);
        }
        return document.createElement("div");
      }
      if (!Note.from(this).text.includes(notesState.filter)) {
        return document.createElement("div");
      } else {
        //during search focus and fold are ignored
        return oldMethod(config, editor);
      }
    }

    //
    // focus & fold
    //
    //TODO simplify
    const note = Note.from(this);
    const parents = [...note.parents];
    if (
      !notesState.focus ||
      notesState.focus.parentKey === this.getKey() ||
      notesState.focus.nodeKey === this.getKey() ||
      [note, ...note.parents].some(
        p => p.lexicalKey === notesState.focus.nodeKey
      )
    ) {
      //
      // is fold?
      //
      if (notesState?.focus?.nodeKey !== note.lexicalKey) {
        for (const p of parents) {
          if (p.fold) {
            return document.createElement("div");
          }
          if (p.lexicalKey === notesState.focus?.nodeKey) {
            break;
          }
        }
      }
      const dom: HTMLElement = oldMethod(config, editor);
      if (note.fold) {
        addClassNamesToElement(dom, "note-folded");
      }
      return dom;
    } else {
      return document.createElement("div");
    }
  });
}

//TODO can't use patch because it's static
const oldClone = ListItemNode.clone;
ListItemNode.clone = function (oldNode: ListItemNode) {
  const newNode = oldClone(oldNode);
  newNode.__fold = oldNode.__fold ?? false;
  return newNode;
};

//can't use patch because it's static
const oldImportJSON = ListItemNode.importJSON;
ListItemNode.importJSON = function (serializedNode) {
  const node = oldImportJSON(serializedNode);
  node.__fold = serializedNode["fold"] ?? false;
  return node;
};

patch(ListItemNode, "exportJSON", function (oldExportJSON) {
  return {
    ...oldExportJSON(),
    fold: this.__fold,
  };
});

patch(
  ListItemNode,
  "insertNewAfter",
  function (old, selection: RangeSelection, restoreSelection = true) {
    // if the current element doesn't have children this code does the same what
    // the original method does, which is inserting a new element after the
    // current
    // if the current element has children, the new element is inserted as a 
    // first child (if the current element is not folded) or after children list
    const nextListItem = this.getNextSibling();
    let childrenListNode: ListNode = nextListItem
      ?.getChildren()
      .find($isListNode);

    const newElement = old(selection, restoreSelection);

    if (this.getFold()) {
      nextListItem?.insertAfter(newElement);
    } else {
      childrenListNode?.getFirstChild()?.insertBefore(newElement);
    }

    return newElement;
  }
);
