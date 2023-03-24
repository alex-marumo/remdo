import { loadEditorState } from "./common";
import { it } from "vitest";

it("create", async ({ editor, expect }) => {
  loadEditorState(editor, "flat");
  //expect(getMinimizedState(editor)).toMatchSnapshot();
  //const [note0, note1, note2] = load("flat");
  //const [note0, subNote0, note1, subNote1] = load("tree");
});

/*
testUpdate("move", ({ root }) => {
    const [notes, note0, note1, note2] = createChildren(root, 2);
    checkChildren(notes, [[note0, note1, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note0, note2]]);

    note0.moveDown();
    checkChildren(notes, [[note1, note2, note0]]);

    note0.moveDown(); // no effect
    checkChildren(notes, [[note1, note2, note0]]);
  });

  testUpdate("move down and up with children", ({ root }) => {
    const [notes, note0, note1, note2, note3] = createChildren(root, 3);
    checkChildren(notes, [[note0, note1, note2, note3]]);

    note1.indent(); //make note1 a child of note0
    const children0 = [[note0, note2, note3], [note1]];
    checkChildren(notes, children0);

    note0.moveDown(); //move note0 and it's child
    const children1 = [[note2, note0, note3], [note1]];
    checkChildren(notes, children1);

    note0.moveDown(); //do it again
    const children2 = [[note2, note3, note0], [note1]];
    checkChildren(notes, children2);

    note0.moveDown(); //do it again with no effect
    checkChildren(notes, children2);

    note0.moveUp();
    checkChildren(notes, children1);

    note0.moveUp();
    checkChildren(notes, children0);

    note0.moveUp(); //no effect
    checkChildren(notes, children0);
  });

*/