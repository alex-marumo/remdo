import "./common"; //imported for side effects
import { it } from "vitest";

it("minimize", async ({ load, editor, expect }) => {
  load("basic");
  await expect(editor).toMatchFileSnapshot("basic.yml");
});

it("set text", async ({ load, lexicalUpdate, expect }) => {
  const { note0 } = load("basic");
  lexicalUpdate(() => {
    expect(note0.text).toBe("note0");

    const newNoteText = "note0 - modified";
    note0.text = newNoteText;
    expect(note0.text).toBe(newNoteText);
  });
});
