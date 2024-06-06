import { createChildren } from "../common";
import { adjustDeltaToGetRoundedTotal } from "./utils";
import { Note } from "@/components/Editor/api";
import { $getRoot, $createTextNode } from "lexical";
import { it } from "vitest";

function getCount(performaceCount: number, regularCount: number) {
  return process.env.VITE_PERFORMANCE_TESTS ? performaceCount : regularCount;
}

/**
 * Timer class to estimate remaining time
 * uses linear regression to keep improving the estimate as the test progresses
 */
class Timer {
  private startTime: number;
  private totalItems: number;
  private times: number[] = [];
  private itemsProcessed: number[] = [];
  private previousRemainingTime: number | null = null;
  private previousElapsedTime: number = 0;

  constructor(totalItems: number) {
    this.startTime = Date.now();
    this.totalItems = totalItems;
  }

  calculateRemainingTime(itemsProcessed: number): string {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;
    const timeSinceLastStep = elapsedTime - this.previousElapsedTime;

    this.times.push(elapsedTime);
    this.itemsProcessed.push(itemsProcessed);

    if (this.itemsProcessed.length < 2) {
      this.previousElapsedTime = elapsedTime;
      return "calculating remaining time...";
    }

    const n = this.itemsProcessed.length;
    const sumX = this.itemsProcessed.reduce((a, b) => a + b, 0);
    const sumY = this.times.reduce((a, b) => a + b, 0);
    const sumXY = this.itemsProcessed.reduce(
      (sum, x, i) => sum + x * this.times[i],
      0
    );
    const sumXX = this.itemsProcessed.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const estimatedRemainingTime =
      slope * (this.totalItems - itemsProcessed) + intercept;
    const remainingTime = estimatedRemainingTime / 1000;

    let adjustmentInfo = "";
    if (this.previousRemainingTime !== null) {
      const adjustment =
        estimatedRemainingTime - this.previousRemainingTime + timeSinceLastStep;
      if (Math.abs(adjustment) > 1000) {
        adjustmentInfo = ` (adjusted by ${adjustment > 0 ? "+" : ""}${(
          adjustment / 1000
        ).toFixed(2)}s)`;
      }
    }

    this.previousRemainingTime = estimatedRemainingTime;
    this.previousElapsedTime = elapsedTime;

    const roundedRemainingTime = Math.round(remainingTime);
    const minutes = Math.floor(roundedRemainingTime / 60);
    const seconds = roundedRemainingTime % 60;

    if (minutes > 0 || seconds > 0) {
      return `~${
        minutes > 0 ? minutes + ":" : ""
      }${seconds}s remaining${adjustmentInfo}`;
    } else {
      return "almost done!";
    }
  }
}

function countNotes(lexicalUpdate: (fn: () => void) => void) {
  /** returns number of notes including the one that's passed as the argument */
  function countChildren(note: Note): number {
    return Array.from(note.children).reduce(
      (acc, child) => acc + countChildren(child) + 1,
      0
    );
  }

  let count: number;
  lexicalUpdate(() => {
    const root = Note.from($getRoot());
    count = countChildren(root);
  });
  return count;
}

/**
 * removes all notes
 */
it("clear", async ({ lexicalUpdate }) => {
  lexicalUpdate(() => {
    $getRoot().clear();
  });
});

/**
 * creates new N notes, never causing that any note has more than MAX_CHILDREN
 */
it(
  "add notes",
  async ({ lexicalUpdate, logger, expect }) => {
    const N = getCount(5000, 20);
    const MAX_CHILDREN = 8;
    const BATCH_SIZE = 100; // too big value causes errors during sync

    function addNotes(count: number) {
      lexicalUpdate(() => {
        const root = Note.from($getRoot());
        const queue: Note[] = [root];
        while (count > 0) {
          const note = queue.shift()!;
          let childrenCount = [...note.children].length;
          while (childrenCount < MAX_CHILDREN && count > 0) {
            const name = note.text.replace("root", "note");
            note.createChild(name + childrenCount);
            childrenCount++;
            count--;
          }
          for (const child of note.children) {
            queue.push(child);
          }
        }
      });
    }

    await logger.info("Test started");
    await logger.info(" counting existing notes...");

    const initialCount = countNotes(lexicalUpdate);
    const adjustedN = adjustDeltaToGetRoundedTotal(initialCount, N);
    const expectedFinalCount = initialCount + adjustedN;
    await logger.info(
      ` initial notes count: ${initialCount} adding ${adjustedN} more (adjusted by ${
        adjustedN - N
      }) for the total of ${expectedFinalCount} notes`
    );

    //on a blank document the first note is empty, let's fix that if needed
    lexicalUpdate(() => {
      const root = Note.from($getRoot());
      const firstChild = [...root.children][0];
      if (firstChild && firstChild.lexicalNode.getChildrenSize() === 0) {
        firstChild.lexicalNode.append($createTextNode("note0"));
      }
    });

    const timer = new Timer(N);
    const numberOfBatches = Math.ceil(adjustedN / BATCH_SIZE);
    for (let remainingCount = adjustedN, batch = 1; remainingCount > 0; batch++) {
      const currentBatchSize = Math.min(BATCH_SIZE, remainingCount);
      addNotes(currentBatchSize);
      remainingCount -= currentBatchSize;

      logger.info(
        ` batch ${batch}/${numberOfBatches}`,
        timer.calculateRemainingTime(remainingCount)
      );

      //TODO try to find a better way to flush websocket data,
      //without that delay some of the data can be lost if too many nodes are
      //added (like N=1000, BATCH=50 run twice)
      await new Promise((r) => setTimeout(r, 50));
    }

    const finalCount = countNotes(lexicalUpdate);
    expect(finalCount).toBe(expectedFinalCount);

    await logger.info(`Done, final notes count: ${finalCount}`);
  },
  60 * 60 * 1000
);

/**
 * reports number of notes
 */
it(
  "count notes",
  async ({ lexicalUpdate, logger }) => {
    await logger.info("Counting notes...");
    const count = countNotes(lexicalUpdate);
    await logger.info(`Notes count: ${count}`);
  },
  20 * 60 * 1000
);

/**
 * clears existing nodes and then creates a tree with N nodes
 * each having MAX_CHILDREN children at most
 */
it(
  "create tree",
  async ({ lexicalUpdate, logger }) => {
    const N = getCount(200, 2);
    const MAX_CHILDREN = 8;
    const timer = new Timer(N);

    let n = N;
    const queue: Note[] = [];
    lexicalUpdate(() => {
      $getRoot().clear();
      const root = Note.from($getRoot());
      queue.push(root);
    });
    while (n > 0) {
      logger.info(n, timer.calculateRemainingTime(n));
      lexicalUpdate(() => {
        const currentNote = queue.shift();
        const parentName = currentNote.text.replace("root", "note");
        for (let i = 0; i < MAX_CHILDREN && n > 0; i++, n--) {
          const newNote = currentNote.createChild(parentName + i);
          queue.push(newNote);
        }
      });
    }

    //remove the first, empty note
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
it(
  "flat list",
  async ({ lexicalUpdate }) => {
    const N = getCount(50, 2);
    const M = getCount(20, 2);
    for (let i = 0; i < N; ++i) {
      lexicalUpdate(() => {
        const root = Note.from($getRoot());
        createChildren(root, M);
      });
    }
  },
  60 * 1000
);
