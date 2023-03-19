import { NotesState } from "./api";
import { FULL_RECONCILE } from "@lexical/LexicalConstants";
import {
  LexicalComposerContextType,
  useLexicalComposerContext,
} from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import { EditorUpdateOptions } from "lexical/LexicalEditor";

export interface NotesLexicalEditor extends LexicalEditor {
  fullUpdate(updateFunction: () => void, options?: EditorUpdateOptions): void;
}

export function useNotesLexicalComposerContext() {
  const [editor, context] = useLexicalComposerContext() as [
    NotesLexicalEditor,
    LexicalComposerContextType
  ];
  editor.fullUpdate = (updateFunction, options) => {
    editor._dirtyType = FULL_RECONCILE;
    editor.update(() => {
      NotesState.getActive()._forceLexicalUpdate();
      updateFunction();
    }, options);
  };
  return [editor, context] as [NotesLexicalEditor, LexicalComposerContextType];
}
