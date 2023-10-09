//TODO add tests
import { NOTES_OPEN_QUICK_MENU_COMMAND } from "../commands";
import { useNotesLexicalComposerContext } from "../NotesComposerContext";
import { Note } from "../api";
import { RemdoNodeEventPlugin } from "./RemdoNodeEventPlugin";
import { getOffsetPosition, isBeforeEvent } from "@/utils";
import { mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  RootNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import React, { useCallback, useEffect, useState } from "react";

export function NoteControlsPlugin() {
  const [editor] = useNotesLexicalComposerContext();
  const [menuStyle, setMenuStyle] = useState(null);
  const [noteElement, setNoteElement] = useState(null);
  const [noteFolded, setNoteFolded] = useState(false);
  const [noteHasChildren, setNoteHasChildren] = useState(false);

  const menuClick = (e) => {
    e.preventDefault();
    const { left, top, height } = getOffsetPosition(editor, e.target);
    editor.update(() => {
      editor.dispatchCommand(NOTES_OPEN_QUICK_MENU_COMMAND, {
        left,
        top: top + height,
        noteKeys: [$getNearestNodeFromDOMNode(noteElement).getKey()],
      });
    });
  };

  const updateNoteState = useCallback(
    (targetElement: HTMLElement, { folded = null } = {}) => {
      if (noteElement === targetElement) {
        return;
      }

      setNoteFolded(
        folded !== null
          ? folded
          : targetElement.classList.contains("note-folded")
      );
      setNoteHasChildren(
        targetElement?.nextElementSibling?.classList.contains("li-nested")
      );
      setNoteElement(targetElement);
    },
    [noteElement]
  );

  const setMenuPosition = useCallback(
    (targetElement: HTMLElement) => {
      if (!targetElement) {
        return;
      }
      updateNoteState(targetElement);
      setMenuStyle({
        ...getOffsetPosition(editor, targetElement),
        transform: `translate(-100%, 0)`,
      });
    },
    [editor, updateNoteState]
  );

  const toggleFold = (event) => {
    event.preventDefault();
    editor.fullUpdate(() => {
      const note = Note.from($getNearestNodeFromDOMNode(noteElement));
      note.folded = !note.folded;
      updateNoteState(noteElement, { folded: note.folded });
    });
  };

  const rootMouseMove = (event: MouseEvent) => {
    //move controls to the hovered note (li)
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
    ) as HTMLElement;
    if (li && li.tagName.toLowerCase() === "li") {
      //TODO if li doesn't change we don't have to do anything, right?
      noteElement?.classList.remove("note-hovered");
      setMenuPosition(li);
      if(isBeforeEvent(li, event)){
        li.classList.add("note-hovered");
      }
    }
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
      <RemdoNodeEventPlugin
        nodeType={RootNode}
        eventType={"mousemove"}
        eventListener={rootMouseMove}
      />
      {menuStyle && (
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
          <a
            href="/"
            onClick={menuClick}
            className="text-decoration-none link-secondary"
          >
            <i className="bi bi-list"></i>
          </a>
        </div>
      )}
    </>
  );
}
