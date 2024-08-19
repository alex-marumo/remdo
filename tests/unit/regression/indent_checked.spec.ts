import "../common";
import { Note } from "@/components/Editor/api";
import { $isListItemNode } from "@lexical/list";
import { $getEditor, $isTextNode } from "lexical";
import { it } from "vitest";

it("broken schema", async ({ load, expect, lexicalUpdate }) => {
  const {note0, note00} = load("basic");
  lexicalUpdate(() => {
    note0.toggleChecked();
    note00.outdent();
  });
  lexicalUpdate(() => {
    expect(note0.checked).toBe(true);
    expect(note00.checked).toBe(true);
  });
});

