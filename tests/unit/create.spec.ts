import { getMinimizedState, loadEditorState } from "./common";
import { describe, it } from "vitest";

describe("create", async () => {
  it("minimize", async ({ editor, expect }) => {
    loadEditorState(editor, "basic");
    expect(getMinimizedState(editor)).toMatchSnapshot();
  });
});
