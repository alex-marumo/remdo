import "./common"; //imported for side effects
import { describe, it } from "vitest";

describe("create", async () => {
  it("minimize", async ({ load, editor, expect }) => {
    load("basic");
    await expect(editor).toMatchFileSnapshot("basic.yml");
  });
});
