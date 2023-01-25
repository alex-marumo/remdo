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
import { useEffect, useRef, useState, useCallback } from "react";
import "./Notes.css";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL } from "lexical";
import { createPortal } from "react-dom";

function $setTempRoot(key, parentKey, state) {
  state._tempRootKey = key;
  state._tempRootParentKey = parentKey;
}

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const changeRoot = useCallback(
    (event, key) => {
      event.preventDefault();
      editor.update(() => {
        const state = editor.getEditorState();
        const liNode = $getNodeByKey(key);
        $setTempRoot(key, liNode.getParent()?.getKey(), state);

        const getText = (node) => node.getAllTextNodes()[0]?.getTextContent();

        setBreadcrumbs([
          ...liNode
            .getParents()
            .filter((node) => $isListItemNode(node))
            .map((note) => ({
              key: note.getKey(),
              text: getText(note),
            })),
          {
            key: liNode.getKey(),
            text: getText(liNode),
          },
        ]);

        //TODO check update args instead: https://discord.com/channels/953974421008293909/955972012541628456/1041741864879013928
        editor.setEditorState(state);
      });
    },
    [editor]
  );

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
      //TODO read or just passinge editor state should be enough, re-check in the newer lexical version
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
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND);
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
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/" onClick={(event) => changeRoot(event, 'root')}>Home</a>
          </li>
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
