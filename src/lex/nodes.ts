import { NotesState, Note, getNotesEditorState } from "../api";
import { patch } from "../utils";
import { $isListNode } from "@lexical/list";

export function applyNodePatches(NodeType: any) {
  /*
    This function customizes updateDOM and createDOM (see below) in an existing
    lexical node class. An alternative would be to use lexical node replacement
    mechanism, but this turns off TextNode merging (see TextNote.isSimpleText() ) 
    it could be fixed, but an additional benefit is that this method is simpler, 
    shorter (doesn't require to implement importJSON, clone, etc.)
    and doesn't rename original types
    */
  patch(NodeType, "updateDOM", function (oldMethod, prevNode, dom, config) {
    const lexicalState = getNotesEditorState();
    //lexicalMethod has to be placed first as it may have some side effects
    return (
      //TODO just checking lexicalState._notesFilterChanged is necessary but not sufficient
      //it may be more efficient to actually check if node will be different after updateDOM
      //for example when it was already filtered out and still needs to be
      oldMethod(prevNode, dom, config) || lexicalState._notesFilterChanged
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
      }
    }

    //
    // focus
    //
    if (
      !notesState.focus ||
      notesState.focus.parentKey === this.getKey() ||
      notesState.focus.nodeKey === this.getKey() ||
      //init note here (i.e. after the previous conditions are checked)
      //and check if it or one of it's parents is focused
      (note =>
        [note, ...note.parents].some(
          p => p.lexicalKey === notesState.focus.nodeKey
        ))(Note.from(this))
    ) {
      //
      // is fold?
      //
      if ([...Note.from(this).parents].some(p => p.fold)) {
        //TODO should be specific to ListNode
        return document.createElement("div");
      }

      const dom: HTMLElement = oldMethod(config, editor);
      return dom;
    } else {
      return document.createElement("div");
    }
  });
}
