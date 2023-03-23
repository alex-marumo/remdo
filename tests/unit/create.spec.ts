import { lexicalStateKeyCompare, loadEditorState } from "./common";
import yaml from "js-yaml";
import { LexicalEditor } from "lexical";
import { describe, it } from "vitest";

/**
 *  converts editor state to JSON with removed defaults
 */
function getMinimizedState(editor: LexicalEditor) {
  type Node = Array<Node> | object;
  function walk(node: Node) {
    function minimize(node: object) {
      const defaults = {
        list: {
          direction: "ltr",
          format: "",
          indent: 0,
          listType: "bullet",
          start: 1,
          tag: "ul",
          version: 1,
        },
        listitem: { direction: "ltr", format: "", indent: 0, version: 1 },
        text: {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: "",
          version: 1,
        },
        undefined: {},
        root: {
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        },
      };

      const d = defaults[node["type"]];
      if (!d) {
        throw new Error("No defaults for " + node["type"]);
      }

      for (const key in node) {
        if (node[key] === d[key]) {
          delete node[key];
        }
      }
    }

    if (["number", "string"].includes(typeof node)) {
      return;
    } else if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        walk(node[i]);
      }
    } else if (node instanceof Object) {
      minimize(node);
      for (const key in node) {
        walk(node[key]);
      }
    } else {
      throw new Error(`Unexpected node: ${node} type: ${typeof node}`);
    }
  }
  const editorState = editor.getEditorState();
  const state = JSON.parse(JSON.stringify(editorState)); // clone deeply
  walk(state);

  return yaml.dump(state, {
    noArrayIndent: true,
    sortKeys: lexicalStateKeyCompare,
  });
}

describe("create", async () => {
  it("minimize", async ({ editor, expect }) => {
    loadEditorState(editor, "basic");
    expect(getMinimizedState(editor)).toMatchSnapshot();
  });

  it("create", async ({ editor, expect }) => {
    loadEditorState(editor, "basic");
    //expect(getMinimizedState(editor)).toMatchSnapshot();
  });
});
