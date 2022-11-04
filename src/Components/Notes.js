import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $getRoot, DecoratorNode, $getNodeByKey, RootNode, INSERT_PARAGRAPH_COMMAND, COMMAND_PRIORITY_HIGH, $isRangeSelection, FOCUS_COMMAND, $getSelection } from 'lexical';
import React, { useEffect, useRef, useState } from 'react';
import "./Notes.css"
import { $createListNode, $createListItemNode, ListItemNode, $isListNode, $isListItemNode, ListNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_EDITOR, BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { createPortal } from 'react-dom';

export class HoveredNoteIcon extends DecoratorNode {

  static getType() {
    return "hoveredNoteIcon";
  }

  static clone(node) {
    return new HoveredNoteIcon(node.__format, node.__key);
  }

  createDOM(config) {
    return document.createElement('span');
  }

  updateDOM(prevNode, dom, config) {
    const inner = dom.firstChild;
    if (inner === null) {
      return true;
    }
    return false;
  }

  decorate() {
    return <span />
    return (
      <span id="hovered-note-icon" className='position-absolute top-0 start-0'>
        <a href="/">...</a>
      </span>
    )
    //return <Note notes={{ 1: { text: "sample note" } }} id={1} />;
  }

  isIsolated() {
    return true;
  }

  remove() {
  }

  isKeyboardSelectable() {
    return false;
  }

  exportJSON() {
    return;
    return {
      ...super.exportJSON(),
      type: this.getType(),
      version: 1,
    }
  }

  static importJSON(serializedNode) {
    //return $createHoveredNoteIcon();
  }

  selectionTransform(prevSelection, nextSelection) {
    return;
  }
}

function $createHoveredNoteIcon() {
  return new HoveredNoteIcon();
}

export function NotesPlugin({ anchorElement }) {
  const [editor] = useLexicalComposerContext();
  let hoveredNoteIconKey = useRef(null);
  const menuRef = useRef(null);
  const [hoveredNoteElement, setHoveredNoteElement] = useState(null);

  function moveHoveredNoteIconNode(noteNode) {
    let hoveredNoteIconNode;
    if (hoveredNoteIconKey.current) {
      hoveredNoteIconNode = $getNodeByKey(hoveredNoteIconKey.current);
    } else {
      hoveredNoteIconNode = $createHoveredNoteIcon()
      hoveredNoteIconKey.current = hoveredNoteIconNode.getKey();
    }
    noteNode.append(hoveredNoteIconNode);
  }

  useEffect(() => {
    function onMouseMove(event) {
      const noteElement = event.target.closest("li");
      if (noteElement) {
        setHoveredNoteElement(noteElement);
      }
    }

    function onMouseLeave() {
      setHoveredNoteElement(null);
    }

    anchorElement?.addEventListener('mousemove', onMouseMove);
    anchorElement?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      anchorElement?.removeEventListener('mousemove', onMouseMove);
      anchorElement?.removeEventListener('mouseleave', onMouseLeave);
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
    const floatingRectangle = floatingElement.getBoundingClientRect();
    const anchorRectangle = anchor.getBoundingClientRect();
    const top = targetRectangle.y - anchorRectangle.y;
    console.log(targetElement, top);
    floatingElement.style.transform = `translate(${0}px, ${top}px)`;
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        //TODO add a comment
        INSERT_PARAGRAPH_COMMAND,
        () => {
          //this replaces $handleListInsertParagraph logic
          //the code below is directly copied from the beggining it
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
      editor.registerMutationListener(ListItemNode, (mutatedNodes) => {
        mutatedNodes.forEach((mutation, key) => {
          if (mutation !== 'created') {
            return;
          }
          editor.update(() => {
            moveHoveredNoteIconNode($getNodeByKey(key));
          })

          editor.getElementByKey(key)
            .addEventListener('mouseover', function (event) {
              editor.update(() => {
                moveHoveredNoteIconNode($getNodeByKey(key));
              })
            });
        })
      }),
      editor.registerNodeTransform(RootNode, rootNode => {
        //console.log("Root transform");
        const children = rootNode.getChildren();
        if (children.length !== 1 || !$isListNode(children[0])) {
          const listNode = $createListNode("bullet");
          const listItemNode = $createListItemNode();
          listItemNode.append(...children);
          listNode.append(listItemNode);
          rootNode.append(listNode);
          listItemNode.select();
          moveHoveredNoteIconNode(listItemNode);
        }
      }),
      editor.registerCommand(
        BLUR_COMMAND,
        (payload) => {
          //console.log("blur change");
          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const focusLIElement = editor.getElementByKey($getSelection().focus.key).closest("li");
          setHoveredNoteElement(focusLIElement);
          return;
          const focusNode = $getNodeByKey($getSelection().focus.key);
          console.log(focusNode.getE);
          return;
          const parents = focusNode.getParents();
          console.log(parents);
          const focusListItemNode = [focusNode, ...focusNode.getParents()].find(parent => $isListItemNode(parent));
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        //console.log("update listener");
        let selectionChanged = false;
        let focusListItemNode = null;
        editorState.read(() => {
          let focus = $getSelection() && $getSelection().focus;
          if (hoveredNoteIconKey.current && focus) {
            let focusNode = $getNodeByKey(focus.key);
            let parents = focusNode.getParents();
            focusListItemNode = [focusNode, ...parents].find(parent => $isListItemNode(parent));
            if (focusListItemNode.getKey() !== $getNodeByKey(hoveredNoteIconKey.current).getParent().getKey()) {
              selectionChanged = true;
            }
          }
        })

        //updating state in update listener is considered an antipattern: https://lexical.dev/docs/concepts/listeners
        //however for now there seems no other way to be notified about selection change 
        if (selectionChanged) {
          editor.update(() => {
            moveHoveredNoteIconNode(focusListItemNode);
          })
        }
      }),
    );
  }, [editor]);

  function clear() {
    editor.update(() => {
      const root = $getRoot()
      root.clear();
      const listNode = $createListNode();
      for (let i = 0; i < 5; ++i) {
        let listItemNode = $createListItemNode();
        if (i === 2) {
          const noteNode = $createHoveredNoteIcon();
          listItemNode.append(noteNode);
          noteNode.current = noteNode;
        }
        listItemNode.append($createTextNode("sample"));
        listNode.append(listItemNode);
      }
      root.append(listNode);
    });
  }
  //console.log("anchor", anchorElement);
  return createPortal(
    <div id="hovered-note-menu" ref={menuRef} style={{ position: "absolute", left: 0, top: 0 }}>
      <a href="/">
        ...
      </a>
    </div>,
    anchorElement,
  );
}
