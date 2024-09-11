import { NotesState, Note } from "@/components/Editor/api";
import { patch } from "@/utils";
import { $isListItemNode, $isListNode, ListItemNode, ListNode } from "@lexical/list";
import {
  addClassNamesToElement,
  removeClassNamesFromElement,
} from "@lexical/utils";
import { LexicalNode, RangeSelection } from "lexical";
import { EditorConfig } from "lexical";

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
    // focus & fold
    //
    const note = Note.from(this);
    if (
      !notesState.focus ||
      notesState.focus.parentKey === this.getKey() ||
      notesState.focus.nodeKey === this.getKey() ||
      [note, ...note.parents].some(
        (p) => p.lexicalKey === notesState.focus.nodeKey
      )
    ) {
      const dom: HTMLElement = oldMethod(config, editor);
      return dom;
    } else {
      return document.createElement("div");
    }
  });
}

//customized version of lexical's function, the only changes are commented
//out lines
function updateChildrenListItemValue(list: ListNode): void {
  //const isNotChecklist = list.getListType() !== 'check';
  let value = list.getStart();
  for (const child of list.getChildren()) {
    if ($isListItemNode(child)) {
      if (child.getValue() !== value) {
        child.setValue(value);
      }
      //if (isNotChecklist && child.getChecked() != null) {
      //  child.setChecked(undefined);
      //}
      if (!$isListNode(child.getFirstChild())) {
        value++;
      }
    }
  }
}

patch(ListItemNode, "transform", function (old, node: LexicalNode) {
  return (node: LexicalNode) => {
    const parent = node.getParent();
    if ($isListNode(parent)) {
      updateChildrenListItemValue(parent);
      //remdo: set checked regardless of parent type
      /*
      if ( parent.getListType() !== "check" && node.getChecked() != null) {
        node.setChecked(undefined);
      }
      */
    }
  };
});

//TODO this method is patched twice, here and above
patch(ListItemNode, "createDOM", function (old, config: EditorConfig, editor) {
  /* 
  add/remove checked class as needed
  it's also done in $setListItemThemeClassNames, but that implementation depends
  on parent list type
  $setListItemThemeClassNames is an unexported and long function, so it's easier
  to patch createDOM/updateDOM
  */
  const dom = old(config, editor);
  const className = config.theme.list?.listitemChecked;
  if (this.getChecked()) {
    addClassNamesToElement(dom, className);
  } else {
    removeClassNamesFromElement(dom, className);
  }
  return dom;
});

//TODO this method is patched twice, here and above
patch(ListItemNode, "updateDOM", function (old, prevNode, dom, config) {
  /* 
  add/remove checked class as needed
  it's also done in $setListItemThemeClassNames, but that implementation depends
  on parent list type
  $setListItemThemeClassNames is an unexported and long function, so it's easier
  to patch createDOM/updateDOM
  */
  const update = old(prevNode, dom, config);
  const className = config.theme.list.listitemChecked;
  if (this.getChecked()) {
    addClassNamesToElement(dom, className);
  } else {
    removeClassNamesFromElement(dom, className);
  }
  return update;
});

/*
CollabElementNode.syncPropertiesFromLexical calls a function with the same name
when called for the first time with a given node the function fills binding.nodePropertires
with the names taken from the node instance.
The problem that this patch solves is that in some cases (particularly in unit 
tests launched in collab mode) folded was not set before the mentioned first call.
Ideally folded property should be added to ListItemNode constructor
but monkey patching it causes errorKlassMismatch.
On top of that I coudn't find a better place to access binding as it's 
not exposed by useYjsCollaboration.
*/
//patch(
//  CollabElementNode,
//  "syncPropertiesFromLexical",
//  function (old: Function, binding: Binding, ...args: any[]) {
//    if (!binding.nodeProperties.get("listitem")) {
//      binding.nodeProperties.set("listitem", [
//        "__type",
//        "__format",
//        "__indent",
//        "__dir",
//        "__value",
//        "__checked",
//        "__folded",
//      ]);
//    }
//    return old(binding, ...args);
//  }
//);
