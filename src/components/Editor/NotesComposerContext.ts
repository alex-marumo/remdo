import { NotesState } from "./api";
import {
  LexicalComposerContextType,
  useLexicalComposerContext,
} from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import { EditorUpdateOptions } from "lexical/LexicalEditor";
import { FULL_RECONCILE } from "./plugins/NotesPlugin/lexicalUnexported";

export interface NotesLexicalEditor extends LexicalEditor {
  fullUpdate(updateFunction: () => void, options?: EditorUpdateOptions): void;
}

export function useNotesLexicalComposerContext() {
  const [editor, context] = useLexicalComposerContext() as [
    NotesLexicalEditor,
    LexicalComposerContextType
  ];
  //TODO check if this is still needed
  editor.fullUpdate = (updateFunction, options) => {
    editor._dirtyType = FULL_RECONCILE;
    editor.update(() => {
      NotesState.getActive()._forceLexicalUpdate();
      updateFunction();
    }, options);
  };
  return [editor, context] as [NotesLexicalEditor, LexicalComposerContextType];
}
