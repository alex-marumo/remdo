import "./common";
import { it } from "vitest";
import { getVisibleNotes } from "./common";

it("focus", async ({ load, queries, expect, lexicalUpdate }) => {
  const { note12 } = load("tree_complex");
  lexicalUpdate(() => {
    note12.focus();
  });
  logger.preview();
  expect(getVisibleNotes(queries)).toEqual([
    'note12',
    'note120',
    'note1200',
    'note1201',
  ]);
});

