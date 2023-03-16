import { NOTES_FOCUS_COMMAND, NOTES_SEARCH_COMMAND } from "../commands";
import { useNotesLexicalComposerContext } from "../lexical/NotesComposerContext";
import { NotesState } from "../lexical/api";
import { mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { KEY_ENTER_COMMAND } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getOffsetPosition } from "@/utils";

function Finder({ stop, filter }) {
  const [editor] = useNotesLexicalComposerContext();
  const [index, setIndex] = useState(0);

  const results = useCallback(
    () => editor.getRootElement().querySelectorAll("li:not(.li-nested)"),
    [editor]
  );

  useEffect(() => {
    editor.fullUpdate(
      () => {
        NotesState.getActive().setFilter(filter);
        $setSelection(null);
      },
      { discrete: true }
    );
    if (index >= results().length) {
      setIndex(0);
    }
  }, [editor, filter, index, results, stop]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          stop();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          setIndex((index + 1) % results().length);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => {
          const resultsLength = results().length;
          setIndex((index - 1 + resultsLength) % resultsLength);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        e => {
          editor.dispatchCommand(NOTES_FOCUS_COMMAND, {
            key: $getNearestNodeFromDOMNode(results()[index]).getKey(),
          });
          stop(e);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, index, results, stop]);

  const getHighlighterStyle = useCallback(() => {
    const _results = results();
    if (!_results) return;
    const element = _results[index];
    if (!element) return;
    const position = getOffsetPosition(editor, element);
    const { height } = getComputedStyle(element, "::before"); //get height of ::before pseudo element as height of the main element may change if it's text length is too long
    return { ...position, height };
  }, [editor, index, results]);

  return (
    <div
      id="highlighter"
      style={getHighlighterStyle()}
      className={"position-absolute"}
    />
  );
}

export function SearchPlugin() {
  const [editor] = useNotesLexicalComposerContext();
  const [noteFilter, setNoteFilter] = useState("");
  const searchInputRef = useRef(null);
  const [finderActive, setFinderActive] = useState(false);

  const stopSearch = useCallback(
    () => {
      setFinderActive(false);
      if (noteFilter) setNoteFilter("");
      searchInputRef.current.blur();
      editor.fullUpdate(
        () => {
          NotesState.getActive().setFilter("");
        },
        { discrete: true }
      );
      editor.focus();
    },
    [editor, noteFilter]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        NOTES_SEARCH_COMMAND,
        () => {
          searchInputRef.current.focus();
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  const keyDownHandler = useCallback(
    (e: any) => {
      const eventMappings = {
        Escape: KEY_ESCAPE_COMMAND,
        Enter: KEY_ENTER_COMMAND,
        ArrowDown: KEY_ARROW_DOWN_COMMAND,
        ArrowUp: KEY_ARROW_UP_COMMAND,
      };

      if (e.key in eventMappings) {
        editor.dispatchCommand(eventMappings[e.key], e);
        e.preventDefault();
      }
    },
    [editor]
  );

  return (
    <>
      <input
        ref={searchInputRef}
        type="text"
        value={noteFilter}
        onChange={e => setNoteFilter(e.target.value)}
        onKeyDown={keyDownHandler}
        onFocus={() => setFinderActive(true)}
        onBlur={stopSearch}
        className="form-control"
        placeholder={
          !finderActive
            ? "Search..."
            : "Type to search... (Arrow Down/Up to navigate, Enter to zoom to the highlighted note, Esc to cancel)"
        }
        role="searchbox"
        id="search"
        autoComplete="off"
      />
      {finderActive &&
        createPortal(
          <Finder stop={stopSearch} filter={noteFilter} />,
          editor.getRootElement().parentElement
        )}
    </>
  );
}
