import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RootNode, INSERT_PARAGRAPH_COMMAND, COMMAND_PRIORITY_HIGH, $isRangeSelection, $getSelection } from 'lexical';
import React, { useEffect, useRef, useState } from 'react';
import "./Notes.css"
import { $createListNode, $createListItemNode, $isListNode, $isListItemNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { createPortal } from 'react-dom';

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);

  useEffect(() => {
    function onMouseMove(event) {
      const noteElement = event.target.closest("li");
      if (noteElement) {
        setHoveredNoteElement(noteElement);
      }
    }

    anchorElement?.addEventListener('mousemove', onMouseMove);

    return () => {
      anchorElement?.removeEventListener('mousemove', onMouseMove);
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

          if (!$isListItemNode(anchor) || anchor.getTextContent() !== '') {
            return false;
          }
          //end of copied code

          let newListItemNode = $createListItemNode();
          anchor.insertAfter(newListItemNode);
          newListItemNode.select();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerNodeTransform(RootNode, rootNode => {
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
        SELECTION_CHANGE_COMMAND,
        () => {
          const focusLIElement = editor.getElementByKey($getSelection().focus.key).closest("li");
          setHoveredNoteElement(focusLIElement);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor]);

  return createPortal(
    <div id="hovered-note-menu" ref={menuRef}>
      <a href="/">
        ...
      </a>
    </div>,
    anchorElement,
  );
}
