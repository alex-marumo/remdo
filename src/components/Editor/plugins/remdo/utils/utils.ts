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

//TODO limit to dev
globalThis.printStack = (message: string | undefined) => {
  //TODO make the path easy to copy & paste
  let res = message ? message + "\n" : "";
  const stack = new Error().stack;
  if (!stack) {
    console.log("No stack available");
    return;
  }
  stack.split("\n")
    .slice(2) //skip "Error"" and this function
    .forEach((line) => {
      let functionName = "";
      let path = "";
      let row = "";
      line.split(/\s+/)
        .filter(word => word.trim() && word.trim() !== "at")
        .forEach((word) => {
          try {
            const url = new URL(word.slice(1, -1));
            const pathnameParts = url.pathname.split(":");
            path = pathnameParts[0];
            row = pathnameParts[1];
          }
          catch {
            //not an URL, so it's likely a function name
            functionName = word;
          }
        });
      //query arg "a" is added, so chrome includes row in the link
      res += `\t${functionName || '(anonymous)'} file://.${path}:${row}?a\n`;
    });
  console.log(res);
};
