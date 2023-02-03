import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getNearestNodeFromDOMNode,
  CLEAR_EDITOR_COMMAND,
  $getNodeByKey,
} from "lexical";
import { FULL_RECONCILE } from "@lexical/LexicalConstants";
import { useEffect, useRef, useState, useCallback } from "react";
import "./Notes.css";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isTextNode,
  $setSelection,
} from "lexical";
import { createPortal } from "react-dom";
import { getActiveEditorState } from "@lexical/LexicalUpdates";
import React from "react";
import PropTypes from "prop-types";
import { $getNodeByKeyOrThrow } from "@lexical/LexicalUtils";
import { patch } from "../utils";

export function applyNodePatches(NodeType) {
  /*
  this function customizes updateDOM and createDOM (see below) in an existing lexical node class
  an alternative would be to use lexical node replacement mechanism, but turns off TextNode merging (see TextNote.isSimpleText() ) 
  it could be fixed, but an additional benefit is that this method is simpler, shorter (doesn't require to implement importJSON, clone, etc.)
  and doesn't rename original types
  */
  patch(NodeType, "updateDOM", function (oldMethod, prevNode, dom, config) {
    //oldMethod has to be placed first as it may have some side effects
    return (
      oldMethod(prevNode, dom, config) || getActiveEditorState()._notesFilter
    );
  });
  patch(NodeType, "createDOM", function (oldMethod, config, editor) {
    const state = editor.getEditorState();
    if (!state._notesFilter || state._notesFilter(this)) {
      return oldMethod(config, editor);
    }
    return document.createElement("div");
  });
}

function $setTempRoot(note) {
  const tempRootKey = note.lexicalKey;
  const tempRootParentKey = note.lexicalNode?.getParent()?.getKey();
  //getActiveEditorState() returns a different state than editor.getEditorState() ¯\_(ツ)_/¯
  const state = getActiveEditorState();

  state._notesFilter = (node) => {
    const key = node.getKey();
    return (
      key == tempRootKey ||
      key === tempRootParentKey ||
      node.getParentKeys().includes(tempRootKey)
    );
  };
}

function closestLINode(lexicalNode) {
  let node = lexicalNode;
  while (node !== null) {
    if ($isListItemNode(node)) {
      return node;
    }
    node = node.getParent();
  }
  return null;
}

const ROOT_TEXT = "Home";

//TODO add unit tests and move this to a separate file
class Note {
  static create(key) {
    let lexicalNode = closestLINode($getNodeByKey(key));
    if (!lexicalNode) {
      return new Note("root");
    }
    let nested = lexicalNode.getChildren().some((child) => $isListNode(child));
    if (nested) {
      return new Note(lexicalNode.getPreviousSibling().getKey());
    }
    return new Note(lexicalNode.getKey());
  }

  constructor(key) {
    this._lexicalKey = key;
  }

  get lexicalNode() {
    return $getNodeByKeyOrThrow(this._lexicalKey);
  }

  get lexicalKey() {
    return this._lexicalKey;
  }

  get parent() {
    if (this.lexicalKey === "root") {
      return null;
    }
    let lexicalParentNode = this.lexicalNode.getParent();
    return Note.create(lexicalParentNode.getKey());
  }

  get parents() {
    const that = this;
    return {
      *[Symbol.iterator]() {
        let parent = that.parent;
        while (parent) {
          yield parent;
          parent = parent.parent;
        }
      },
    };
  }

  get plainText() {
    if (this.lexicalKey === "root") {
      return ROOT_TEXT;
    }
    return [
      ...this.lexicalNode
        .getChildren()
        .filter((child) => $isTextNode(child))
        .map((child) => child.getTextContent()),
    ].join("");
  }
}

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { key: "root", text: ROOT_TEXT },
  ]);
  const [nodeFilter, setNodeFilter] = useState("");

  const changeRoot = useCallback(
    (event, key) => {
      event.preventDefault();
      editor._dirtyType = FULL_RECONCILE;
      editor.update(() => {
        const note = Note.create(key);
        $setTempRoot(note);

        //TODO won't update if path is changed elsewhere
        setBreadcrumbs(
          [note, ...note.parents].reverse().map((p) => ({
            key: p.lexicalNode.getKey(),
            text: p.plainText,
          }))
        );
      });
    },
    [editor]
  );

  useEffect(() => {
    editor._dirtyType = FULL_RECONCILE;
    editor.update(() => {
      //getActiveEditorState() returns a different state than editor.getEditorState() ¯\_(ツ)_/¯
      const state = getActiveEditorState();
      state._notesFilter = (node) => {
        if (nodeFilter.length === 0) {
          return true;
        }
        let text = null;
        if ($isListItemNode(node)) {
          text = node.getAllTextNodes()[0]?.getTextContent();
        } else if ($isTextNode(node)) {
          text = node.getTextContent();
        }

        return !text || text.includes(nodeFilter);
      };
      //prevent editor from re-gaining focus
      $setSelection(null);
    });
  }, [editor, nodeFilter]);

  useEffect(() => {
    function onMouseMove(event) {
      const noteElement = event.target.closest("li");
      if (noteElement) {
        //show menu
        setHoveredNoteElement(noteElement);
      }
    }

    function onClick(event) {
      if (!event.target.matches("li")) {
        return;
      }
      let key;
      //TODO read or just passinge editor state should be enough, re-check in a newer lexical version
      editor.update(() => {
        key = $getNearestNodeFromDOMNode(event.target).getKey();
      });
      changeRoot(event, key);
    }

    anchorElement?.addEventListener("mousemove", onMouseMove);
    anchorElement?.addEventListener("click", onClick);

    return () => {
      anchorElement?.removeEventListener("mousemove", onMouseMove);
      anchorElement?.removeEventListener("click", onClick);
    };
  }, [anchorElement, editor, changeRoot]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(hoveredNoteElement, menuRef.current, anchorElement);
    }
  }, [anchorElement, hoveredNoteElement]);

  function setMenuPosition(targetElement, floatingElement, anchor) {
    if (!targetElement) {
      return;
    }
    const targetRectangle = targetElement.getBoundingClientRect();
    const anchorRectangle = anchor.getBoundingClientRect();
    const top = targetRectangle.y - anchorRectangle.y;
    floatingElement.style.transform = `translate(${0}px, ${top}px)`;
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        //test case "create empty notes"
        INSERT_PARAGRAPH_COMMAND,
        () => {
          //this replaces $handleListInsertParagraph logic
          //the default implementation replaces and empty list element to a paragraph efectively ending a list
          //this version just creates a new empty list item
          //
          //the code below is directly copied from the beggining of $handleListInsertParagraph function from lexical's code
          const selection = $getSelection();

          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }
          // Only run this code on empty list items
          const anchor = selection.anchor.getNode();

          if (!$isListItemNode(anchor) || anchor.getTextContent() !== "") {
            return false;
          }
          //end of copied code

          let newListItemNode = $createListItemNode();
          anchor.insertAfter(newListItemNode);
          newListItemNode.select();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerNodeTransform(RootNode, (rootNode) => {
        //test case "generate content"
        const children = rootNode.getChildren();
        if (children.length === 1 && $isListNode(children[0])) {
          return;
        }
        const listNode = $createListNode("bullet");
        const listItemNode = $createListItemNode();
        listItemNode.append(...children);
        listNode.append(listItemNode);
        rootNode.append(listNode);
        listItemNode.select();
      }),
      editor.registerCommand(
        //close menu and change its position
        SELECTION_CHANGE_COMMAND,
        () => {
          const focusLIElement = editor
            .getElementByKey($getSelection().focus.key)
            .closest("li");
          setHoveredNoteElement(focusLIElement);
          setMenuExpanded(false);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor]);

  const menuClick = (e) => {
    e.preventDefault();

    setMenuExpanded(true);
  };

  const clearContent = () => {
    editor.update(() => {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
    });
  };

  const testAction = (event) => {
    event.preventDefault();
    console.clear();
    editor._dirtyType = FULL_RECONCILE;
    editor.update(() => {
      console.log("testing");
    });
  };

  return (
    <div>
      <nav aria-label="breadcrumb">
        <button
          type="button"
          className="btn btn-link float-end"
          onClick={clearContent}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn-link float-end"
          onClick={testAction}
        >
          Test
        </button>
        <ol className="breadcrumb">
          {breadcrumbs.map((note, idx, { length }) => {
            return idx + 1 < length ? (
              <li className="breadcrumb-item" key={note.key}>
                <a href="/" onClick={(event) => changeRoot(event, note.key)}>
                  {note.text}
                </a>
              </li>
            ) : (
              <li
                className="breadcrumb-item active"
                aria-current="page"
                key={note.key}
              >
                {note.text}
              </li>
            );
          })}
        </ol>
      </nav>

      <input
        type="text"
        value={nodeFilter}
        onChange={(e) => setNodeFilter(e.target.value)}
        className="form-control"
        placeholder="Search..."
        id="search"
      />
      {createPortal(
        <div id="hovered-note-menu" ref={menuRef}>
          {!menuExpanded ? (
            <a href="/" onClick={menuClick}>
              ...
            </a>
          ) : (
            <ul>
              <li>option1</li>
              <li>option2</li>
              <li>option3</li>
              <li>option4</li>
            </ul>
          )}
        </div>,
        anchorElement
      )}
    </div>
  );
}

NotesPlugin.propTypes = {
  anchorElement: PropTypes.object.isRequired,
};
