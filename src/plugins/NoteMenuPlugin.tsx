import { SELECTION_CHANGE_COMMAND } from "../../lexical/packages/lexical/src/LexicalCommands";
import { COMMAND_PRIORITY_HIGH } from "../../lexical/packages/lexical/src/LexicalEditor";
import { Note } from "@/api";
import { NOTES_MOVE_COMMAND, NOTES_SEARCH_COMMAND } from "@/commands";
import { useNotesLexicalComposerContext } from "@/lex/NotesComposerContext";
import { INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

type Action = () => void;

class NoteMenuOption {
  key: string;
  title: JSX.Element;
  icon?: JSX.Element;
  action: Action;

  constructor(args: { title: string; icon?: JSX.Element; action?: Action }) {
    const regex = /(.+)?<b>(.)<\/b>(.+)?/;
    const [, beginning, key, end] = args.title.match(regex);
    this.key = key.toLowerCase();
    this.title = (
      <>
        {beginning}
        <b>{key}</b>
        {end}
      </>
    );
    this.icon = args.icon;
    this.action = args.action.bind(this);
  }
}

function MenuOptions({ closeMenu, anchorElement }) {
  const [editor] = useNotesLexicalComposerContext();
  const [highlightedOptionIndex, setHighlightedOptionIndex] = useState(null);

  const options = useMemo(
    () => [
      new NoteMenuOption({
        title: "<b>F</b>old",
        icon: <i className="bi bi-arrows-collapse" />,
        action: () => {
          //TODO use a directive
          editor.fullUpdate(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              return false;
            }
            const note = Note.from(selection.focus.key);
            note.fold = !note.fold;
          });
        },
      }),
      new NoteMenuOption({
        title: "<b>M</b>ove to...",
        icon: <i className="bi bi-arrow-right-square" />,
        action: () => editor.dispatchCommand(NOTES_MOVE_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "<b>S</b>earch...",
        icon: <i className="bi bi-search" />,
        action: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Go <b>h</b>ome",
        icon: <i className="bi bi-house-door" />,
        action: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "<b>Z</b>oom in",
        icon: <i className="bi bi-zoom-in" />,
        action: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Zoom <b>o</b>ut",
        icon: <i className="bi bi-zoom-out" />,
        action: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Toggle <b>l</b>ist type",
        icon: <i className="bi bi-list-ol" />,
        action: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
    ],
    [editor]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent) => {
          options[highlightedOptionIndex].action();
          event.preventDefault();
          event.stopImmediatePropagation();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        event => {
          if (
            event.key === "ArrowDown" ||
            (event.key === "Tab" && !event.shiftKey)
          ) {
            setHighlightedOptionIndex(
              highlightedOptionIndex === null
                ? 0
                : (highlightedOptionIndex + 1) % options.length
            );
          } else if (
            event.key == "ArrowUp" ||
            (event.key === "Tab" && event.shiftKey)
          ) {
            setHighlightedOptionIndex(
              (highlightedOptionIndex - 1 + options.length) % options.length
            );
          } else {
            const key = event.key.toLowerCase();
            const selected = options.find(o => o.key === key);
            if (!selected) {
              return false;
            }
            selected.action();
          }
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ESCAPE_COMMAND,
        event => {
          closeMenu();
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_BACKSPACE_COMMAND,
        event => {
          closeMenu();
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        closeMenu,
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(CLICK_COMMAND, closeMenu, COMMAND_PRIORITY_HIGH)
    );
  });

  const menuStyle = useCallback(() => {
    const selection = window.getSelection();
    const { x, y } = selection.getRangeAt(0).getBoundingClientRect();
    const { x: aX, y: aY } = anchorElement.getBoundingClientRect();
    return {
      left: x - aX + "px",
      top: y - aY + "px",
    };
  }, [anchorElement]);

  return (
    <ul
      className="list-group position-absolute dropdown"
      id="quick-menu"
      style={menuStyle()}
    >
      <li className="list-group-item">
        <h6 className="dropdown-header">Press a key...</h6>
      </li>
      {options.map((option, index) => {
        const active = highlightedOptionIndex === index;
        return !option.title ? null : (
          <li
            key={option.key}
            tabIndex={-1}
            className={`list-group-item${active ? " active" : ""}`}
            role="option"
            aria-selected={active}
            aria-current={active}
            id={"typeahead-item-" + index}
            onMouseEnter={() => {
              setHighlightedOptionIndex(index);
            }}
            onClick={() => {
              option.action();
            }}
          >
            <button className="dropdown-item" type="button">
              {option.icon}&nbsp;
              <span className="text">{option.title}</span>
            </button>
          </li>
        );
      })}
      <li className="list-group-item">
        <h6 className="dropdown-header">Hints</h6>
      </li>
      <li className="list-group-item">
        <button className="dropdown-item" type="button">
          <i className="bi bi-file-binary" />
          &nbsp;Press 1-9 to set fold level
        </button>
      </li>
    </ul>
  );
}

export function NoteMenuPlugin() {
  const [editor] = useNotesLexicalComposerContext();
  const hotKeyPressed = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorElement = editor.getRootElement()?.parentElement;

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        event => {
          if (event.key !== "Shift") {
            hotKeyPressed.current = false;
            return false;
          }
          if (!hotKeyPressed.current) {
            hotKeyPressed.current = true;
            return false;
          }
          hotKeyPressed.current = false;
          setMenuOpen(true);

          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  });

  return (
    anchorElement &&
    ReactDOM.createPortal(
      <div>
        {menuOpen && (
          <MenuOptions
            closeMenu={() => {
              setMenuOpen(false);
              return false;
            }}
            anchorElement={anchorElement}
          />
        )}
      </div>,
      anchorElement
    )
  );
}
