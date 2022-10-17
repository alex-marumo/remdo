import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $getRoot, DecoratorNode, $getNodeByKey } from 'lexical';
import React, { useEffect, useRef } from 'react';
import "./Notes.css"
import { $createListNode, $createListItemNode, ListItemNode } from '@lexical/list';

export class NoteNode extends DecoratorNode {

  static getType() {
    return "note";
  }

  static clone(node) {
    return new NoteNode(node.__format, node.__key);
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
    <span id="note-node" className='position-absolute top-0 start-0 note-menu'>
      <a href="/">...</a>
    </span>
    )
    //return <Note notes={{ 1: { text: "sample note" } }} id={1} />;
  }
}

function $createNoteNode(className, emojiText) {
  return new NoteNode();
}

export function NotesPlugin() {
  const [editor] = useLexicalComposerContext();
  let activeNoteNode = useRef(null);

  useEffect(() => {
    return editor.registerMutationListener(ListItemNode, (mutatedNodes) => {
      mutatedNodes.forEach((mutation, key) => {
        if (mutation === 'created') {
          let element = editor.getElementByKey(key);
          element.addEventListener('mouseover', function (event) {
            if (activeNoteNode.current != null) {
              editor.update(() => {
                $getNodeByKey(key).getFirstDescendant().insertAfter(activeNoteNode.current);
              })
            }
          });
        }
      }
      )
    });
  }, [editor]);

  function clear() {
    editor.update(() => {
      const root = $getRoot()
      root.clear();
      const listNode = $createListNode();
      for (let i = 0; i < 5; ++i) {
        let listItemNode = $createListItemNode();
        if (i === 2) {
          const noteNode = $createNoteNode();
          listItemNode.append(noteNode);
          activeNoteNode.current = noteNode;
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
