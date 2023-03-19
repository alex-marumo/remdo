import { checkChildren, createChildren, debug, testUpdate } from "./common";
import { Note, NotesState } from "@/components/Editor/lexical/api";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { $createTextNode, $getRoot, $setSelection, ElementNode } from "lexical";
import { describe, it, expect, beforeEach } from "vitest";


describe("API", async () => {
  beforeEach(async context => {
    context.lexicalUpdate(() => {
      $getRoot().clear();
    });
    //this have to be a separate, discrete update, so appropriate listener can
    //be fired afterwards and create the default root note
    context.lexicalUpdate(() => {
      $getRoot()
        .getChildren()
        .find($isListNode)
        .getFirstChildOrThrow()
        .append($createTextNode("note0"));
  
      //otherwise we can get some errors about missing functions in the used
      //DOM implementation
      $setSelection(null);
    });
  });

  testUpdate("create notes", ({ rootNode }) => {
    expect(rootNode.getChildrenSize()).toEqual(1);
    expect(rootNode.getChildren()[0]).toSatisfy($isListNode);

    const listNode: ElementNode = rootNode.getFirstChild();
    expect(listNode.getChildrenSize()).toEqual(1);
    expect(listNode.getChildren()[0]).toSatisfy($isListItemNode);

    const liNode: ElementNode = listNode.getFirstChild();
    expect(liNode.getChildrenSize()).toBe(1);
  });

  testUpdate("create notes", ({ root }) => {
    const note0 = [...root.children][0];
    const notes = [root, note0];

    checkChildren(notes, [[note0]]);

    const note1 = note0.createChild("note1");
    notes.push(note1);
    checkChildren(notes, [[note0], [note1]]);
    expect(note1.text).toEqual("note1");

    const note2 = note0.createChild();
    notes.push(note2);
    checkChildren(notes, [[note0], [note1, note2]]);
    expect(note2.text).toEqual("");
  });

  testUpdate("indent and outdent", ({ root }) => {
    expect([...root.children].length).toEqual(1);

    const [notes, note0, note1, note2] = createChildren(root, 2);
    checkChildren(notes, [[note0, note1, note2]]);

    note1.indent();
    checkChildren(notes, [[note0, note2], [note1]]);

    note1.indent(); //no effect
    checkChildren(notes, [[note0, note2], [note1]]);

    note2.indent();
    checkChildren(notes, [[note0], [note1, note2]]);

    note2.indent();
    checkChildren(notes, [[note0], [note1], [note2]]);

    note2.indent(); //no effect
    checkChildren(notes, [[note0], [note1], [note2]]);

    note2.outdent();
    checkChildren(notes, [[note0], [note1, note2]]);

    note2.outdent();
    checkChildren(notes, [[note0, note2], [note1]]);

    note2.outdent(); //no effect
    checkChildren(notes, [[note0, note2], [note1]]);

    note1.outdent();
    checkChildren(notes, [[note0, note1, note2]]);
  });

  testUpdate("indent and out with children", ({ root }) => {
    expect([...root.children].length).toEqual(1);

    const [notes, note0, note1, note2, note3, note4] = createChildren(root, 4);
    checkChildren(notes, [[note0, note1, note2, note3, note4]]);

    note3.indent();
    checkChildren(notes, [[note0, note1, note2, note4], [], [], [note3]]);

    note2.indent();
    checkChildren(notes, [[note0, note1, note4], [], [note2], [note3]]);

    note2.outdent();
    checkChildren(notes, [[note0, note1, note2, note4], [], [], [note3]]);
  });

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

  /** creates N times M children in the root */
  it(
    "performance",
    async context => {
      const N = 2;
      const M = 2;
      for (let i = 0; i < N; ++i) {
        //console.log("i", i);
        context.lexicalUpdate(() => {
          const root = Note.from($getRoot());
          createChildren(root, M);
        });
        //TODO test is it still needed with discrete === true
        await new Promise(r => setTimeout(r, 10));
      }
    },
    60 * 1000
  );

  it("focus", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());

      const [, , note1, note2] = createChildren(root, 3);
      note1.indent();
      note2.indent();
      note2.indent();
    });

    //note0, note1, note2, note3 (root doesn't count as it's a div not li)
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(4);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.focus();
    });

    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);
  });

  it("focus and add children", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.focus();
    });

    //note0
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(1);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const note0 = [...root.children][0];
      note0.createChild("note1");
      root.createChild("note2");
    });

    //note0, note1
    //note2 should be filtered out as it's not a child of focused node
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(2);
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      root.focus();
    });
    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);
  });

  it("filter", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const notesState = NotesState.getActive();

      createChildren(root, 1);
      //filter that matches all notes
      notesState.setFilter("note");

      //to make sure that notes created after setting filter behave in the same way as already existing ones
      createChildren(root, 1);
    });

    //note0, note1, note2
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(3);

    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const notesState = NotesState.getActive();
      notesState.setFilter("note1");

      //to make sure that notes created after setting filter behave in the same way as already existing ones
      createChildren(root, 1);
    });

    debug();
    //note1
    expect(context.queries.getAllNotNestedIListItems()).toHaveLength(1);
  });

  it("fold", async context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const [notes, note0, note1, note2, note3] = createChildren(root, 3);
      note2.indent();
      note1.indent();
      note0.fold = true;
    });
    //TODO check visibility once folding changes rendering instead of just hiding via css
  });

  it.skip("focus and filter", null);

  it.skip("playground", context => {
    context.lexicalUpdate(() => {
      const root = Note.from($getRoot());
      //const note0 = [...root.children][0];
      createChildren(root, 3);
    });
  });
});
