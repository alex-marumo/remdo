import { loadEditorState } from "./common";
import { it } from "vitest";

it("check/uncheck", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "single");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => (note0.checked = true));
  await expect(editor).toMatchFileSnapshot("checked.yml");

  lexicalUpdate(() => (note0.checked = false));
  await expect(editor).toMatchFileSnapshot("base.yml");
});

it("toggle check", async ({ editor, expect, lexicalUpdate }) => {
  const { note0 } = loadEditorState(editor, "single");
  await expect(editor).toMatchFileSnapshot("base.yml");

  lexicalUpdate(() => note0.toggleChecked());
  await expect(editor).toMatchFileSnapshot("checked.yml");

  lexicalUpdate(() => note0.toggleChecked());
  await expect(editor).toMatchFileSnapshot("base.yml");
});

it("check/uncheck recursively", async ({ editor, expect, lexicalUpdate }) => {
  const { note0, note00 } = loadEditorState(editor, "basic");
  await expect(editor).toMatchFileSnapshot("base.yml");
  lexicalUpdate(() => {
    expect(note0.checked).toBeFalsy();
    expect(note00.checked).toBeFalsy();
  });

  lexicalUpdate(() => {
    note0.checked = true;
    expect(note0.checked).toBeTruthy();
    expect(note00.checked).toBeTruthy();
  });
  await expect(editor).toMatchFileSnapshot("checked.yml");

  lexicalUpdate(() => {
    note0.checked = false;
    expect(note0.checked).toBeFalsy();
    expect(note00.checked).toBeFalsy();
  });
  await expect(editor).toMatchFileSnapshot("base.yml");
});

it("toggle check recursively", async ({ editor, expect, lexicalUpdate }) => {
  const { note0, note00 } = loadEditorState(editor, "basic");
  await expect(editor).toMatchFileSnapshot("base.yml");
  lexicalUpdate(() => {
    expect(note0.checked).toBeFalsy();
    expect(note00.checked).toBeFalsy();
  });

  lexicalUpdate(() => {
    note0.toggleChecked();
    expect(note0.checked).toBeTruthy();
    expect(note00.checked).toBeTruthy();
  });
  await expect(editor).toMatchFileSnapshot("checked.yml");

  lexicalUpdate(() => {
    note0.toggleChecked();
    expect(note0.checked).toBeFalsy();
    expect(note00.checked).toBeFalsy();
  });
  await expect(editor).toMatchFileSnapshot("base.yml");
});
