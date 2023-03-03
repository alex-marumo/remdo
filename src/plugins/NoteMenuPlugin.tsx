import { Note } from "@/api";
import { NOTES_MOVE_COMMAND, NOTES_SEARCH_COMMAND } from "@/commands";
import { useNotesLexicalComposerContext } from "@/lex/NotesComposerContext";
import { INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import {
  LexicalTypeaheadMenuPlugin,
  TriggerFn,
  TypeaheadOption,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";

class NoteMenuOption extends TypeaheadOption {
  title: JSX.Element;
  icon?: JSX.Element;
  trigger: () => void;

  constructor(args: {
    title: string;
    icon?: JSX.Element;
    trigger?: () => void;
  }) {
    const regex = /(.+)?<b>(.)<\/b>(.+)?/;
    if (!args.title) {
      super(null);
    } else {
      const [, beginning, key, end] = args.title.match(regex);
      super(key.toLowerCase());
      this.title = (
        <>
          {beginning}
          <b>{key}</b>
          {end}
        </>
      );
      this.icon = args.icon;
      this.trigger = args.trigger.bind(this);
    }
  }
}

export function NoteMenuPlugin(): JSX.Element {
  const [editor] = useNotesLexicalComposerContext();
  const triggerPattern = ",,";
  const triggerPatternIndex = useRef(0);
  const menuOpen = useRef(false);
  const highlightedIndex = useRef(null);

  function cleanUp() {
    menuOpen.current = false;
    triggerPatternIndex.current = 0;

    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return;
    }
    const anchor = selection.anchor;
    if (anchor.type !== "text") {
      return;
    }
    const anchorNode = anchor.getNode();
    if (!anchorNode.isSimpleText()) {
      return;
    }
    anchorNode.spliceText(
      anchorNode.getTextContentSize() - triggerPattern.length,
      triggerPattern.length,
      "",
      true
    );
  }

  function triggerOption(option: NoteMenuOption) {
    editor.update(() => {
      cleanUp();
      option.trigger();
    });
  }

  const checkForTriggerMatch: TriggerFn = (text: string) => {
    return !menuOpen.current
      ? null
      : {
          leadOffset: text.length,
          matchingString: "",
          replaceableString: "",
        };
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent) => {
          if (!menuOpen.current) {
            return false;
          }
          triggerOption(options[highlightedIndex.current]);
          event.preventDefault();
          event.stopImmediatePropagation();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        event => {
          if (menuOpen.current) {
            //menu is already open, so try to trigger an option using a hot key
            const selected = options.find(o => o.key === event.key);
            if (!selected) {
              return false;
            }
            triggerOption(selected);
            event.preventDefault();
            event.stopImmediatePropagation();
            return true;
          }
          if (event.key === triggerPattern[triggerPatternIndex.current]) {
            triggerPatternIndex.current++;
          }
          if (triggerPatternIndex.current === triggerPattern.length) {
            menuOpen.current = true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ESCAPE_COMMAND,
        event => {
          if (!menuOpen.current) {
            return false;
          }
          editor.update(() => {
            cleanUp();
          });
          event.preventDefault();
          event.stopImmediatePropagation();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  });

  const options = useMemo(() => {
    const baseOptions = [
      /*
      the first, empty option is not displayed
      the idea is to have a dummy placeholder as TypeaheadPlugin forces the 
      first option to be highlighted
      */
      new NoteMenuOption({ title: "" }),
      new NoteMenuOption({
        title: "<b>F</b>old",
        icon: <i className="bi bi-arrows-collapse" />,
        trigger: () => {
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
        trigger: () => editor.dispatchCommand(NOTES_MOVE_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "<b>S</b>earch...",
        icon: <i className="bi bi-search" />,
        trigger: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Go <b>h</b>ome",
        icon: <i className="bi bi-house-door" />,
        trigger: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "<b>Z</b>oom in",
        icon: <i className="bi bi-zoom-in" />,
        trigger: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Zoom <b>o</b>ut",
        icon: <i className="bi bi-zoom-out" />,
        trigger: () => editor.dispatchCommand(NOTES_SEARCH_COMMAND, undefined),
      }),
      new NoteMenuOption({
        title: "Toggle <b>l</b>ist type",
        icon: <i className="bi bi-list-ol" />,
        trigger: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
    ];

    return baseOptions;
  }, [editor]);

  return (
    <LexicalTypeaheadMenuPlugin<NoteMenuOption>
      onQueryChange={() => null}
      onSelectOption={() => null}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        highlightedIndex.current = selectedIndex;

        return anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
              <ul className="list-group position-absolute">
                <li className="list-group-item">
                  <h6 className="dropdown-header">Press a key...</h6>
                </li>
                {options.map((option, index) => {
                  const active = selectedIndex === index;
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
                        setHighlightedIndex(index);
                      }}
                      onClick={() => {
                        triggerOption(option);
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
              </ul>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
}
