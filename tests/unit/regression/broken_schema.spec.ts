import "../common";
import { Note } from "@/components/Editor/api";
import { getActiveEditorState } from "@lexical/LexicalUpdates";
import { $isListItemNode } from "@lexical/list";
import { $isTextNode } from "lexical";
import { it } from "vitest";

it("broken schema", async ({ load, expect, lexicalUpdate }) => {
  load("tests/data/regression/broken_schema");
  lexicalUpdate(() => {
    const listItem = Array.from(getActiveEditorState()._nodeMap.values())
      .find((n) => $isTextNode(n) && n.getTextContent() === "outdent")
      .getParent();
    expect($isListItemNode(listItem)).toBeTruthy();
    expect(listItem.getIndent()).toBe(4);
    Note.from(listItem).outdent();
    expect(listItem.getIndent()).toBeLessThan(4);
  });
});
