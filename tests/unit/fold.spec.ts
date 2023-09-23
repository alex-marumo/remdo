import { loadEditorState } from "./common";
import { it } from "vitest";

it("folding", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "basic");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => (note0.folded = true));
  await expect(editor).toMatchFileSnapshot("folded.yml");

  lexicalUpdate(() => (note0.folded = true)); //noop
  await expect(editor).toMatchFileSnapshot("folded.yml");

  lexicalUpdate(() => (note0.folded = false));
  await expect(editor).toMatchFileSnapshot("base.yml");
});

//FIXME doesn't propagate correctly to other clients in Collab mode. Probably because node patches are not applied correctly
//TODO when fixing also add a check that will assure that patches won't be applied twice
it("load folded", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "folded");
  lexicalUpdate(() => {
    expect(note0.folded).toBeTruthy();
  });
});

it("modify folded", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "folded");
  lexicalUpdate(() => {
    note0.lexicalNode.getFirstChild().setTextContent("note0 - modified");
  });
  lexicalUpdate(() => {
    expect(note0.folded).toBeTruthy();
  });
  await expect(editor).toMatchFileSnapshot("modified.yml");
});

it("fold to a specific level", async ({ editor, expect, lexicalUpdate }) => {
  const { root } = loadEditorState(editor, "tree_complex");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => root.setFoldLevel(1));
  await expect(editor).toMatchFileSnapshot("folded1.yml");

  lexicalUpdate(() => root.setFoldLevel(2));
  await expect(editor).toMatchFileSnapshot("folded2.yml");

  lexicalUpdate(() => root.setFoldLevel(3));
  await expect(editor).toMatchFileSnapshot("folded3.yml");

  lexicalUpdate(() => root.setFoldLevel(4));
  await expect(editor).toMatchFileSnapshot("folded4.yml");

  lexicalUpdate(() => root.setFoldLevel(9));
  await expect(editor).toMatchFileSnapshot("folded4.yml");

  lexicalUpdate(() => root.setFoldLevel(0));
  await expect(editor).toMatchFileSnapshot("folded4.yml");

  lexicalUpdate(() => root.setFoldLevel(1));
  lexicalUpdate(() => root.setFoldLevel(0));
  await expect(editor).toMatchFileSnapshot("folded4.yml");
});
