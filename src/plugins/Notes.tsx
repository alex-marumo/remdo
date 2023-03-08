import { KEY_BACKSPACE_COMMAND } from "../../lexical/packages/lexical/src/LexicalCommands";
import { useNotesLexicalComposerContext } from "../lex/NotesComposerContext";
import "./Notes.css";
import { Note } from "@/api";
import { NOTES_FOLD_COMMAND } from "@/commands";
import { NoteControls } from "@/components/NoteControls";
import { Search } from "@/components/Search";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
  ListItemNode,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getNearestNodeFromDOMNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
} from "lexical";
import { COMMAND_PRIORITY_CRITICAL } from "lexical";
import PropTypes from "prop-types";
import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";

export function NotesPlugin({ anchorElement }) {
  const [editor] = useNotesLexicalComposerContext();
  const [breadcrumbs, setBreadcrumbs] = useState([
    { key: "root", text: "ToDo" },
  ]);
  const navigate = useNavigate();
  const locationParams = useParams();
  const rootRef = useRef("");

  const setFocus = useCallback(
    (key: string) => {
      editor.fullUpdate(
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
    setFocus(locationParams["noteID"]);
  }, [setFocus, locationParams]);

  useEffect(() => {
    function onClick(event: React.MouseEvent<HTMLElement>) {
      const target = event.target as HTMLElement;
      if (
        !target.matches("li") ||
        target.getBoundingClientRect().x <= event.clientX
      ) {
        return;
      }
      let key: string;
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
          setFocus(noteID);
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

          const newListItemNode = $createListItemNode();
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
        NOTES_FOLD_COMMAND,
        () => {
          //TODO create notes API for that
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }
          editor.fullUpdate(() => {
            Note.from(selection.focus.key).fold = true;
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [setFocus, editor, locationParams, rootKeyDownListener]);

  return (
    <>
      <nav aria-label="breadcrumb">
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
      <Search />
      {createPortal(<NoteControls />, anchorElement)}
    </>
  );
}

NotesPlugin.propTypes = {
  anchorElement: PropTypes.object.isRequired,
};
