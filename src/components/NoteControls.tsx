import { Note } from "@/api";
import { useNotesLexicalComposerContext } from "@/lex/NotesComposerContext";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  RootNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { element } from "prop-types";
import React, { useCallback, useEffect, useState } from "react";

export function NoteControls({
  anchorElement,
}: {
  anchorElement: HTMLElement;
}) {
  const [editor] = useNotesLexicalComposerContext();
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [noteFolded, setNoteFolded] = useState(false);
  const [noteHasChildren, setNoteHasChildren] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [noteElement, setNoteElement] = useState(null);

  const menuClick = e => {
    e.preventDefault();

    setMenuExpanded(true);
  };

  const updateNoteState = useCallback(
    (targetElement: HTMLElement, { fold = null } = {}) => {
      setNoteFolded(
        fold !== null ? fold : targetElement.classList.contains("note-folded")
      );
      setNoteHasChildren(
        targetElement?.nextElementSibling?.classList.contains("li-nested")
      );
      setNoteElement(targetElement);
    },
    []
  );

  const setMenuPosition = useCallback(
    (targetElement: HTMLElement) => {
      if (!targetElement) {
        return;
      }
      updateNoteState(targetElement);
      const targetRectangle = targetElement.getBoundingClientRect();
      const anchorRectangle = anchorElement.getBoundingClientRect();
      const top = targetRectangle.y - anchorRectangle.y;
      const left =
        targetRectangle.x -
        anchorRectangle.x -
        parseFloat(getComputedStyle(targetElement, ":before").width);
      //TODO work on the relevant test
      setMenuStyle({
        transform: `translate(${left}px, ${top}px) translate(-100%, 0)`,
      });
    },
    [anchorElement, updateNoteState]
  );

  const toggleFold = event => {
    event.preventDefault();
    editor.fullUpdate(() => {
      const node = $getNearestNodeFromDOMNode(noteElement);
      const note = Note.from(node);
      note.fold = !note.fold;
      updateNoteState(noteElement, { fold: note.fold });
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
    li &&
      li.tagName.toLowerCase() === "li" &&
      setMenuPosition(li as HTMLElement);
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }
          const focusLIElement = editor
            .getElementByKey(selection.focus.key)
            .closest("li");
          setMenuPosition(focusLIElement);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, setMenuPosition]);

  return (
    <>
      <NodeEventPlugin
        nodeType={RootNode}
        eventType={"mousemove"}
        eventListener={rootMouseMove}
      />
      <div id="hovered-note-menu" style={menuStyle}>
        {noteHasChildren && (
          <a
            href="/"
            onClick={toggleFold}
            className="text-decoration-none link-secondary"
          >
            <i className={"bi bi-" + (noteFolded ? "plus" : "dash")}></i>
          </a>
        )}
        &nbsp;
        {!menuExpanded ? (
          <a
            href="/"
            onClick={menuClick}
            className="text-decoration-none link-secondary"
          >
            <i className="bi bi-list"></i>
          </a>
        ) : (
          <ul>
            <li>option1</li>
            <li>option2</li>
            <li>option3</li>
            <li>option4</li>
          </ul>
        )}
      </div>
    </>
  );
}
