import { NotesState } from "@/api";
import { useNotesLexicalComposerContext } from "@/lex/NotesComposerContext";
import { $setSelection } from "lexical";
import React, { useEffect, useState } from "react";

export function Search() {
  const [editor] = useNotesLexicalComposerContext();
  const [noteFilter, setNoteFilter] = useState("");

  useEffect(() => {
    editor.fullUpdate(() => {
      const notesState = NotesState.getActive();
      notesState.setFilter(noteFilter);
      $setSelection(null);
    });
  }, [editor, noteFilter]);

  return (
    <input
      type="text"
      value={noteFilter}
      onChange={e => setNoteFilter(e.target.value)}
      className="form-control"
      placeholder="Search..."
      role="searchbox"
      id="search"
    />
  );
}
