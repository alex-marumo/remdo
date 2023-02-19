import { patch } from "./utils";
import { NotesState, Note } from "./api";

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
    const notesState = NotesState.getActive();
    //lexicalMethod has to be placed first as it may have some side effects
    return (
      oldMethod(prevNode, dom, config) || notesState.focus || notesState.filter
    );
  });

  patch(NodeType, "createDOM", function (oldMethod, config, editor) {
    const notesState = NotesState.getActive();

    //
    // search filter
    //
    if (notesState.filter && !Note.from(this).text.includes(notesState.filter)) {
      return document.createElement("div");
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
      return oldMethod(config, editor);
    } else {
      return document.createElement("div");
    }
  });
}
