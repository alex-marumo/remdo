import {
  NOTES_FOCUS_COMMAND,
  NOTES_START_MOVING_COMMAND,
  NOTES_SEARCH_COMMAND,
  NOTES_MOVE_COMMAND,
} from "../commands";
import { useNotesLexicalComposerContext } from "../NotesComposerContext";
import { Note, NotesState } from "../api";
import { getOffsetPosition } from "@/utils";
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
import { LexicalEditor } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

class Action {
  stop: () => void;

  constructor({ stop }) {
    this.stop = stop;
  }

  info = () => null;
}

class ActionSearch extends Action {
  placeholder =
    "Type to search... (Arrow Down/Up to navigate, Enter to zoom to the highlighted note, Esc to cancel)";
  command = NOTES_FOCUS_COMMAND;
  highlighterID = "search-highlighter";
  dispatch(editor: LexicalEditor, targetKey: string) {
    editor.dispatchCommand(NOTES_FOCUS_COMMAND, {
      key: targetKey,
    });
  }
}

//TODO replace with NoteText component
type NoteData = {
  text: string;
  key: string;
};

class ActionMove extends Action {
  notesData: NoteData[];

  constructor({ stop, notesData }) {
    super({ stop });
    this.notesData = notesData;
  }

  placeholder =
    "Search for the new location... (Arrow Down/Up to navigate, Enter to move, Esc to cancel)";
  command = NOTES_MOVE_COMMAND;
  //info = () => (
  //  <div className="text-secondary">Moving note: {this.notesData[0].text}</div>
  //);
  highlighterID = "move-highlighter";
  dispatch(editor: LexicalEditor, targetKey: string) {
    editor.dispatchCommand(NOTES_MOVE_COMMAND, {
      keys: this.notesData.map(noteData => noteData.key),
      targetKey,
    });
  }
}

function Finder({ action, filter }) {
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
  }, [editor, filter, index, results]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          action.stop();
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
          const target = $getNearestNodeFromDOMNode(results()[index]).getKey();
          action.dispatch(editor, target);
          action.stop(e);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [action, editor, index, results]);

  const getHighlighterStyle = useCallback(() => {
    const _results = results();
    if (!_results) return;
    const element = _results[index];
    if (!element) return;
    const position = getOffsetPosition(editor, element);
    const height = getComputedStyle(element).lineHeight;
    const marginLeft = getComputedStyle(element, "::before").width;
    return { ...position, height, marginLeft };
  }, [editor, index, results]);

  return (
    <div
      id={action.highlighterID}
      style={getHighlighterStyle()}
      className={"position-absolute"}
    />
  );
}

export function SearchPlugin() {
  const [editor] = useNotesLexicalComposerContext();
  const [noteFilter, setNoteFilter] = useState("");
  const searchInputRef = useRef(null);
  const [action, setAction] = useState(null);

  const stopSearch = useCallback(() => {
    setAction(null);
    if (noteFilter) {
      setNoteFilter("");
    }
    searchInputRef.current.blur();
    editor.fullUpdate(
      () => {
        NotesState.getActive().setFilter("");
      },
      { discrete: true }
    );
    editor.focus();
  }, [editor, noteFilter]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        NOTES_SEARCH_COMMAND,
        () => {
          searchInputRef.current.focus();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        NOTES_START_MOVING_COMMAND,
        ({ keys }) => {
          setAction(
            new ActionMove({
              stop: stopSearch,
              notesData: keys.map(key => ({
                text: Note.from(key).text,
                key: key,
              })),
            })
          );
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, stopSearch]);

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

  useEffect(() => {
    if (action) {
      searchInputRef.current.focus();
    }
  }, [action]);

  const handleFocus = () => {
    if (!action) {
      setAction(new ActionSearch({ stop: stopSearch }));
    }
  };

  return (
    <>
      <input
        ref={searchInputRef}
        type="text"
        value={noteFilter}
        onChange={e => setNoteFilter(e.target.value)}
        onKeyDown={keyDownHandler}
        onFocus={handleFocus}
        onBlur={stopSearch}
        className="form-control"
        placeholder={action?.placeholder ?? "Search..."}
        role="searchbox"
        id="search"
        autoComplete="off"
      />
      {action?.info()}
      {action &&
        createPortal(
          <Finder action={action} filter={noteFilter} />,
          editor.getRootElement().parentElement
        )}
    </>
  );
}
