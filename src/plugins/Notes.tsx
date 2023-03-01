import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getNearestNodeFromDOMNode,
  CLEAR_EDITOR_COMMAND,
  $getRoot,
  COMMAND_PRIORITY_LOW,
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
  ListItemNode,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $setSelection,
} from "lexical";
import { createPortal } from "react-dom";
import React from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Note, NotesState } from "@/api";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { NOTES_FOLD_COMMAND } from "@/commands";
import { KEY_BACKSPACE_COMMAND } from "../../lexical/packages/lexical/src/LexicalCommands";

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { key: "root", text: "ToDo" },
  ]);
  const [noteFilter, setNoteFilter] = useState("");
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
          note.focus();

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
      const notesState = NotesState.getActive();
      notesState.setFilter(noteFilter);
      $setSelection(null);
    });
  }, [editor, noteFilter]);

  useEffect(() => {
    function onClick(event: React.MouseEvent<HTMLElement>) {
      const target = event.target as HTMLElement;
      if (
        !target.matches("li") ||
        target.getBoundingClientRect().x <= event.clientX
      ) {
        return;
      }
      let key;
      //TODO read or just passing editor state should be enough, re-check in a newer lexical version
      editor.update(() => {
        key = $getNearestNodeFromDOMNode(target).getKey();
      });
      navigate(`/note/${key}`);
    }

    anchorElement?.addEventListener("click", onClick);

    return () => {
      anchorElement?.removeEventListener("click", onClick);
    };
  }, [anchorElement, editor, navigate]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(hoveredNoteElement, menuRef.current, anchorElement);
    }
  }, [anchorElement, hoveredNoteElement]);

  function setMenuPosition(
    targetElement: HTMLElement,
    floatingElement: HTMLElement,
    anchor: HTMLAnchorElement
  ) {
    if (!targetElement) {
      return;
    }
    const targetRectangle = targetElement.getBoundingClientRect();
    const anchorRectangle = anchor.getBoundingClientRect();
    const floatingRectangle = floatingElement.getBoundingClientRect();
    const top = targetRectangle.y - anchorRectangle.y;
    const left =
      targetRectangle.x -
      anchorRectangle.x -
      floatingRectangle.width -
      parseFloat(getComputedStyle(targetElement, ":before").width);
    floatingElement.style.transform = `translate(${left}px, ${top}px)`;
  }

  const rootKeyDownListener = useCallback(
    //TODO add browser test and move this somewhere else
    (e: KeyboardEvent) => {
      if (
        e.metaKey &&
        (e.key === "ArrowDown" || e.key === "ArrowUp") &&
        !(e.altKey || e.shiftKey || e.ctrlKey)
      ) {
        e.preventDefault();
        editor.update(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const nodesInSelection = selection.getNodes();
          const note = Note.from(nodesInSelection[0]);
          if (e.key === "ArrowDown") {
            note.moveDown();
          } else {
            note.moveUp();
          }
        });
      }
    },
    [editor]
  );

  useEffect(() => {
    return mergeRegister(
      //TODO double check if the listener callback is stable between calls to this code
      editor.registerRootListener((rootElement, prevRootElement) => {
        rootElement &&
          rootElement.addEventListener("keydown", rootKeyDownListener);
        prevRootElement &&
          prevRootElement.removeEventListener("keydown", rootKeyDownListener);
      }),
      editor.registerMutationListener(ListItemNode, mutatedNodes => {
        const { noteID } = locationParams;
        if (
          //TODO re-check
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
          //the default implementation replaces an empty list item with a
          //paragraph effectively ending the list
          //this version just creates a new empty list item
          //
          //the code below is directly copied from the beginning of
          //$handleListInsertParagraph function from lexical's code
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
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event: KeyboardEvent | null) => {
          //do not allow to delete top level list item node as otherwise the document structure may be invalid
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }
          const node = $getNodeByKey(selection.anchor.key);
          if (!$isListItemNode(node)) {
            return false;
          }
          if (
            !node.getPreviousSibling() &&
            node.getParent().getParent().getKey() === "root"
          ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerNodeTransform(RootNode, rootNode => {
        //forces the right editor structure:
        //  root
        //    ul
        //      ...
        //test case "generate content"
        const children = $getRoot().getChildren();
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
          if (!$isRangeSelection(selection)) {
            return false;
          }
          //TODO use notes api
          const focusLIElement = editor
            .getElementByKey(selection.focus.key)
            .closest("li");
          setHoveredNoteElement(focusLIElement);
          setMenuExpanded(false);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        NOTES_FOLD_COMMAND,
        () => {
          //TODO create notes API for that
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }
          console.log("command", selection.focus.key);
          //getActiveEditorState()._di = FULL_RECONCILE;
          editor._dirtyType = FULL_RECONCILE;
          editor.update(() => {
            Note.from(selection.focus.key).fold = true;
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [changeRoot, editor, locationParams, rootKeyDownListener]);

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

  const toggleFold = event => {
    event.preventDefault();
    editor._dirtyType = FULL_RECONCILE; //TODO
    editor.update(() => {
      NotesState.getActive()._forceLexicalUpdate(); //TODO
      const node = $getNearestNodeFromDOMNode(hoveredNoteElement);
      const note = Note.from(node);
      note.fold = !note.fold;
    });
  };

  const rootMouseMove = (event: MouseEvent) => {
    //it would be easier to assign this listener to ListItemNode instead of RootNode
    //the problem is that indented ListItem element don't extend to the left side of the RootNode element
    //this is also why, it's better to find list items on the very right side of the RootNode element
    const editorRect = editor.getRootElement().getBoundingClientRect();
    const editorComputedStyle = getComputedStyle(editor.getRootElement());
    const li = document.elementFromPoint(
      editorRect.left +
        parseFloat(editorComputedStyle.width) -
        parseFloat(editorComputedStyle.paddingRight) -
        parseFloat(editorComputedStyle.borderRightWidth) -
        1,
      event.y
    );
    li && setHoveredNoteElement(li);
  };

  return (
    <>
      <NodeEventPlugin
        nodeType={RootNode}
        eventType={"mousemove"}
        eventListener={rootMouseMove}
      />
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
        value={noteFilter}
        onChange={e => setNoteFilter(e.target.value)}
        className="form-control"
        placeholder="Search..."
        role="searchbox"
        id="search"
      />
      {createPortal(
        <div id="hovered-note-menu" ref={menuRef}>
          {!menuExpanded ? (
            <a href="/" onClick={menuClick} className="text-decoration-none">
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
          &nbsp;
          <a href="/" onClick={toggleFold} className="text-decoration-none">
            +
          </a>
        </div>,
        anchorElement
      )}
    </>
  );
}

NotesPlugin.propTypes = {
  anchorElement: PropTypes.object.isRequired,
};
