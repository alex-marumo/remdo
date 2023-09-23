import { loadEditorState } from "./common";
import { it } from "vitest";

it("reorder flat", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "flat");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => note0.moveDown());
  await expect(editor).toMatchFileSnapshot("note0-down-x1.yml");

  lexicalUpdate(() => note0.moveDown());
  await expect(editor).toMatchFileSnapshot("note0-down-x2.yml");

  lexicalUpdate(() => note0.moveDown()); //noop
  await expect(editor).toMatchFileSnapshot("note0-down-x2.yml");

  lexicalUpdate(() => note0.moveUp());
  await expect(editor).toMatchFileSnapshot("note0-down-x1.yml");

  lexicalUpdate(() => note0.moveUp());
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => note0.moveUp()); //noop
  await expect(editor).toMatchFileSnapshot("base.yml");
});

it("reorder tree", async ({ editor, expect, lexicalUpdate }) => {
  const { note0, subNote0 } = loadEditorState(editor, "tree");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => note0.moveDown());
  await expect(editor).toMatchFileSnapshot("note0-down.yml");

  lexicalUpdate(() => note0.moveDown()); //noop
  await expect(editor).toMatchFileSnapshot("note0-down.yml");

  lexicalUpdate(() => note0.moveUp());
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => note0.moveUp()); //noop
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => subNote0.moveUp()); //noop
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => subNote0.moveDown()); //noop
  await expect(editor).toMatchFileSnapshot("base.yml");
});
