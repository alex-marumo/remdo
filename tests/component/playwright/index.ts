import { LexicalEditor, $getRoot } from "lexical";
import { node } from "prop-types";

console.log(
  "this message will be silently eaten as logger is not configured yet in test spec"
);

globalThis.testUpdateListener = function (editor: LexicalEditor) {
  console.log(
    $getRoot()
      .getAllTextNodes()
      .map(node => node.getTextContent())
      .join(", ")
  );
};
