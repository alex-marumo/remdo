import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $getRoot, DecoratorNode, $getNodeByKey, RootNode, INSERT_PARAGRAPH_COMMAND, COMMAND_PRIORITY_HIGH, $isRangeSelection } from 'lexical';
import React, { useEffect, useRef } from 'react';
import "./Notes.css"
import { $createListNode, $createListItemNode, ListItemNode, $isListNode, $isListItemNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import { $getSelection } from 'lexical';
import { LexicalNode } from 'lexical';

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
}

function $createHoveredNoteIcon() {
  return new HoveredNoteIcon();
}

export function NotesPlugin() {
  const [editor] = useLexicalComposerContext();
  let hoveredNoteIconKey = useRef(null);

  function moveHoveredNoteIconNode(noteNode) {
    let iconNode = $getNodeByKey(hoveredNoteIconKey.current);
    noteNode.append(iconNode);
  }

  useEffect(() => {
    console.log(LexicalNode);
    return mergeRegister(
      editor.registerCommand(
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
        const children = rootNode.getChildren();
        if (children.length !== 1 || !$isListNode(children[0])) {
          const listNode = $createListNode("bullet");
          const listItemNode = $createListItemNode();
          listItemNode.append(...children);
          listNode.append(listItemNode);
          rootNode.append(listNode);
          listItemNode.select();
          if (!hoveredNoteIconKey.current) {
            let hoveredNoteIconNode = $createHoveredNoteIcon()
            hoveredNoteIconKey.current = hoveredNoteIconNode.getKey();
            listItemNode.append(hoveredNoteIconNode);
          }
        }
      }),
      editor.registerUpdateListener(({editorState}) => {
        if(!hoveredNoteIconKey.current) {
          return;
        }
        let selectionChanged = false;
        let focusListItemNode = null;
        editorState.read(() => {
          let focusNode = $getNodeByKey($getSelection().focus.key);
          let parents = focusNode.getParents();
          focusListItemNode = [focusNode, ...parents].find(parent => $isListItemNode(parent));
          if(focusListItemNode.getKey() !== $getNodeByKey(hoveredNoteIconKey.current).getParent().getKey()) {
            selectionChanged = true;
          }
        })

        if(!selectionChanged) {
          return;
        }
        //updating state in update listener is considered an antipattern: https://lexical.dev/docs/concepts/listeners
        //however for now there seems no other way to be notified about selection change 
        editor.update(() => {
          moveHoveredNoteIconNode(focusListItemNode);
        })
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

  return (
    <div>
      <button onClick={clear}>Clear</button>
    </div>);
}
