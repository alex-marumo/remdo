import {
  $getEditor,
  $setSelection,
} from "lexical";
import { nanoid } from "nanoid";
import { FULL_RECONCILE } from "./unexported";

export function $setSearchFilter(filter: string) {
  const editor = $getEditor();
  editor._dirtyType = FULL_RECONCILE;
  editor._remdoState.setFilter(filter);
  $setSelection(null);
};

globalThis.remdoGenerateNoteID = () => {
  return nanoid(8);
};

