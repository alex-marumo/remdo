import { createChildren } from "./common";
import { Note } from "@/components/Editor/lexical/api";
import { $getRoot } from "lexical";
import { it } from "vitest";

/**
 * creates a tree with N nodes, each having MAX_CHILDREN children at most
 */
it.skip(
  "tree",
  async ({ lexicalUpdate }) => {
    const N = 2000;
    const MAX_CHILDREN = 8;

    let n = N;
    const queue: Note[] = [];
    lexicalUpdate(() => {
      const root = Note.from($getRoot());
      queue.push(root);
    });
    while (n > 0) {
      lexicalUpdate(() => {
        const currentNote = queue.shift();
        const parentName = currentNote.text.replace("root", "note");
        for (let i = 0; i < MAX_CHILDREN && n > 0; i++, n--) {
          const newNote = currentNote.createChild(parentName + i);
          queue.push(newNote);
        }
      });
    }

    lexicalUpdate(() => {
      const root = Note.from($getRoot());
      [...root.children][0].lexicalNode.remove();
    });
  },
  60 * 1000
);

/**
 * creates flat list of N times M children in the root
 */
it.skip(
  "flat list",
  async ({ lexicalUpdate }) => {
    const N = 10;
    const M = 50;
    for (let i = 0; i < N; ++i) {
      lexicalUpdate(() => {
        const root = Note.from($getRoot());
        createChildren(root, M);
      });
    }
  },
  60 * 1000
);
