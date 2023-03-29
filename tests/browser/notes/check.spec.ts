import { getEditorHTML, loadEditorState } from "../common";
import { expect, test } from "@playwright/test";

test.fixme("load editor state", async ({ page }) => {
  await loadEditorState(page, "single");
  //expect(await getEditorHTML(page)).toMatchSnapshot();
});
