import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getNearestNodeFromDOMNode,
  CLEAR_EDITOR_COMMAND,
} from "lexical";
import { FULL_RECONCILE } from "@lexical/LexicalConstants";
import { useEffect, useRef, useState, useCallback } from "react";
import "./Notes.css";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
  ListItemNode,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isTextNode,
  $setSelection,
} from "lexical";
import { createPortal } from "react-dom";
import React from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";

import { patch } from "../utils";
import { Note, getNotesEditorState } from "@/api";

export function applyNodePatches(NodeType) {
  /*
  This function customizes updateDOM and createDOM (see below) in an existing
  lexical node class. An alternative would be to use lexical node replacement
  mechanism, but this turns off TextNode merging (see TextNote.isSimpleText() ) 
  it could be fixed, but an additional benefit is that this method is simpler, 
  shorter (doesn't require to implement importJSON, clone, etc.)
  and doesn't rename original types
  */
  patch(NodeType, "updateDOM", function (oldMethod, prevNode, dom, config) {
    //oldMethod has to be placed first as it may have some side effects
    return (
      oldMethod(prevNode, dom, config) || getNotesEditorState()._notesFilter
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
  const state = getNotesEditorState();

  state._notesFilter = node => {
    const key = node.getKey();
    return (
      key == tempRootKey ||
      key === tempRootParentKey ||
      node.getParentKeys().includes(tempRootKey)
    );
  };
}

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { key: "root", text: "ToDo" },
  ]);
  const [nodeFilter, setNodeFilter] = useState("");
  const navigate = useNavigate();
  const locationParams = useParams();
  const rootRef = useRef("");

  const changeRoot = useCallback(
    (key: string) => {
      editor._dirtyType = FULL_RECONCILE;
      editor.update(
        () => {
          const note = Note.from(key);
          rootRef.current = note.lexicalKey;
          $setTempRoot(note);

          //TODO won't update if path is changed elsewhere
          setBreadcrumbs(
            [note, ...note.parents].reverse().map(p => ({
              key: p.lexicalNode.getKey(),
              text: p.text,
            }))
          );
        },
        { discrete: true }
      );
    },
    [editor]
  );

  useEffect(() => {
    changeRoot(locationParams["noteID"]);
  }, [changeRoot, locationParams]);

  useEffect(() => {
    editor._dirtyType = FULL_RECONCILE;
    editor.update(() => {
      const state = getNotesEditorState();
      state._notesFilter = node => {
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
      //TODO read or just passing editor state should be enough, re-check in a newer lexical version
      editor.update(() => {
        key = $getNearestNodeFromDOMNode(event.target).getKey();
      });
      navigate(`/note/${key}`);
    }

    anchorElement?.addEventListener("mousemove", onMouseMove);
    anchorElement?.addEventListener("click", onClick);

    return () => {
      anchorElement?.removeEventListener("mousemove", onMouseMove);
      anchorElement?.removeEventListener("click", onClick);
    };
  }, [anchorElement, editor, navigate]);

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
      editor.registerMutationListener(ListItemNode, mutatedNodes => {
        const { noteID } = locationParams;
        if (
          rootRef.current !== noteID &&
          mutatedNodes.get(noteID) === "created"
        ) {
          changeRoot(noteID);
        }
      }),
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
      editor.registerNodeTransform(RootNode, rootNode => {
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
          const selection = $getSelection();
          if(!$isRangeSelection(selection)) {
            return false;
          }
          const focusLIElement = editor
            .getElementByKey(selection.focus.key)
            .closest("li");
          setHoveredNoteElement(focusLIElement);
          setMenuExpanded(false);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [changeRoot, editor, locationParams]);

  const menuClick = e => {
    e.preventDefault();

    setMenuExpanded(true);
  };

  const clearContent = () => {
    editor.update(() => {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
    });
  };

  const testAction = event => {
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
                <Link to={`/note/${note.key}`}>{note.text}</Link>
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
        onChange={e => setNodeFilter(e.target.value)}
        className="form-control"
        placeholder="Search..."
        role="searchbox"
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
