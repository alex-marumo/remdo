import { NOTES_MOVE_COMMAND, NOTES_TOGGLE_FOLD_COMMAND } from "../commands";
import { useNotesLexicalComposerContext } from "../lexical/NotesComposerContext";
import { Note } from "../lexical/api";
import { Navigation } from "./NavigationPlugin";
import { NoteControlsPlugin } from "./NoteControlsPlugin";
import "./NotesPlugin.scss";
import { SearchPlugin } from "./SearchPlugin";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
} from "@lexical/list";
import { ListItemNode } from "@lexical/list";
import { $getNearestBlockElementAncestorOrThrow, mergeRegister } from "@lexical/utils";
import { $isRootNode, DELETE_CHARACTER_COMMAND, KEY_BACKSPACE_COMMAND } from "lexical";
import {
  RootNode,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isRangeSelection,
  $getSelection,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
} from "lexical";
import { COMMAND_PRIORITY_CRITICAL } from "lexical";
import PropTypes from "prop-types";
import { useEffect, useCallback } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { $isTargetWithinDecorator } from "../lexical/utils";

export function NotesPlugin({ anchorElement }) {
  const [editor] = useNotesLexicalComposerContext();

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
        NOTES_TOGGLE_FOLD_COMMAND,
        ({ noteKeys }) => {
          if (!noteKeys.length) {
            return false;
          }
          editor.fullUpdate(() => {
            const fold = !Note.from(noteKeys[0]).fold;
            noteKeys.forEach(key => {
              Note.from(key).fold = fold;
            });
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        NOTES_MOVE_COMMAND,
        ({ keys, targetKey }) => {
          const moved: ListItemNode = $getNodeByKey(keys[0]);
          const target: ListItemNode = $getNodeByKey(targetKey);
          target.insertAfter(moved);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<KeyboardEvent>(
        //copied from lexical/packages/lexical-rich-text/src/index.ts 
        //to change the behavior when backsapce is pressed at the beginning of a
        //list item node and delete the list item instead of outdenting it
        //the only difference in the implementation is the commented out code
        //and the priority of the command
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if ($isTargetWithinDecorator(event.target as HTMLElement)) {
            return false;
          }
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }
          event.preventDefault();
          const {anchor} = selection;
          const anchorNode = anchor.getNode();
  
          /*
          if (
            selection.isCollapsed() &&
            anchor.offset === 0 &&
            !$isRootNode(anchorNode)
          ) {
            const element = $getNearestBlockElementAncestorOrThrow(anchorNode);
            if (element.getIndent() > 0) {
              return editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            }
          }
          */
          return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
        },
        COMMAND_PRIORITY_LOW,
      ),  
    );
  }, [editor, rootKeyDownListener]);

  return (
    <>
      <Navigation anchorElement={anchorElement} />
      <SearchPlugin />
      {createPortal(<NoteControlsPlugin />, anchorElement)}
    </>
  );
}

NotesPlugin.propTypes = {
  anchorElement: PropTypes.object.isRequired,
};
