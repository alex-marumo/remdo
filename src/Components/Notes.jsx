import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getNearestNodeFromDOMNode,
  CLEAR_EDITOR_COMMAND,
  $isTextNode,
} from "lexical";
import { useEffect, useRef, useState } from "react";
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

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

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
      editor.update(() => {
        //TODO store in editor instead
        const liNode = $getNearestNodeFromDOMNode(event.target);
        document.tempRootKey = liNode.getKey();
        document.tempRootParentKey = liNode.getParent().getKey();
        document.tempRootChanged = true;

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
        const state = editor.getEditorState();
        editor.setEditorState(state);
      });
    }

    anchorElement?.addEventListener("mousemove", onMouseMove);
    anchorElement?.addEventListener("click", onClick);

    return () => {
      anchorElement?.removeEventListener("mousemove", onMouseMove);
      anchorElement?.removeEventListener("click", onClick);
    };
  }, [anchorElement, editor]);

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
            <a href="/">Home</a>
          </li>
          {breadcrumbs.map((note, idx, {length}) => {
            return idx + 1 < length ?
            <li className="breadcrumb-item" key={note.key}>
              <a href="/">{note.text}</a>
            </li>
            :
            <li class="breadcrumb-item active" aria-current="page">{note.text}</li>
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
