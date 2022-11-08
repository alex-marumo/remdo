import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RootNode, INSERT_PARAGRAPH_COMMAND, COMMAND_PRIORITY_HIGH, $isRangeSelection, $getSelection, $getRoot } from 'lexical';
import React, { useEffect, useRef, useState } from 'react';
import "./Notes.css"
import { $createListNode, $createListItemNode, $isListNode, $isListItemNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { createPortal } from 'react-dom';

export function NotesPlugin({ anchorElement, yjsDataRef }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);
  const [yjsData, setYJSData] = useState(null);

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
      editor.registerUpdateListener(() => {
        console.log(yjsDataRef.current);
        setYJSData(JSON.stringify(yjsDataRef.current));
      })
    );
  }, [editor]);

  function changeNode(e) {
    e.preventDefault();

    editor.update(() => {
      let root = $getRoot();
      console.log("root", root);
      root.__children = ['5'];
    })
    /*
    let state = editor.getEditorState();
    let nodeMap = state._nodeMap;
    console.log(nodeMap);
    nodeMap['root_old'] = nodeMap['root'];
    nodeMap['root'] = nodeMap['4'];
    editor._dirtyType = 2; //TODO use FULL_RECONCILE
    editor.setEditorState(state);
    console.log(editor.getEditorState()._nodeMap);
    */
  }

  return (
    <div>
      <span>{yjsData}</span>
      {createPortal(
      <div id="hovered-note-menu" ref={menuRef}>
        <a href="/" onClick={changeNode}>
          ...
        </a>
      </div>,
      anchorElement,
      )}
  </div>);
}
