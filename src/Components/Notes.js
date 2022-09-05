import React from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, $getSelection } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import "./Notes.css"
import { TextNode } from "lexical";


class EmojiNode extends TextNode {
  static getType() {
    return "emoji";
  }

  static clone(node) {
    return new EmojiNode(node.__className, node.__text, node.__key);
  }

  constructor(className, text, key) {
    super(text, key);
    this.__className = className;
  }

  createDOM(config) {
    const dom = document.createElement("span");
    const inner = super.createDOM(config);
    dom.className = this.__className;
    inner.className = "emoji-inner";
    dom.appendChild(inner);
    return dom;
  }

  updateDOM(prevNode, dom, config) {
    const inner = dom.firstChild;
    if (inner === null) {
      return true;
    }
    super.updateDOM(prevNode, inner, config);
    return false;
  }
}

export function $isEmojiNode(node) {
  return node instanceof EmojiNode;
}

export function $createEmojiNode(className, emojiText) {
  return new EmojiNode(className, emojiText).setMode("token");
}

function emoticonTransform(node) {
  const textContent = node.getTextContent().slice(-2);
  // When you type :), we will replace it with an emoji node
  console.log("ok", textContent)
  if (textContent === ":)") {
    node.replace($createEmojiNode("emoji happysmile", "🙂"));
  }
}

function useEmoticons(editor) {
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(
      TextNode,
      emoticonTransform
    );
    return () => {
      removeTransform();
    };
  }, [editor]);
}

function EmoticonPlugin() {
  const [editor] = useLexicalComposerContext();
  useEmoticons(editor);
  return null;
}


// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

const editorConfig = {
    onError(error) {
        throw error;
    },
    nodes: [EmojiNode]
};

function onChange(editorState) {
    editorState.read(() => {
        // Read the contents of the EditorState here.
        const root = $getRoot();
        const selection = $getSelection();

        console.log(root, selection);
    });
}

function Placeholder() {
    return <div className="editor-placeholder">Enter some plain text...</div>;
}

function Note(props) {
    const [hover, setHover] = React.useState(false);
    const [folded, setFolded] = React.useState(false);
    const note = props.notes[props.id];

    return (<li className='note'>
        {
            note.children
            &&
            <button type="button" className="btn btn-link shadow-none fold position-absolute start-0" onClick={() => setFolded(!folded)}>
                {folded ? "+" : "-"}
            </button>
        }
        <a href='/'>
            <i
                className={"bi align-middle p-1 " + (hover ? "bi-circle-fill" : "bi-circle")}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            ></i>
        </a>
        {note.text}
        {
            !folded
            &&
            <ul className='list-unstyled'>
                {note.children && note.children.map((id) => <Note key={id.toString()} notes={props.notes} id={id} />)}
            </ul>
        }
    </li>)
}

function Notes(props) {
    const [notes, setNotes] = React.useState({
        1: {
            children: [2, 3, 4, 5],
            text: "sample note 1",
        },
        2: {
            text: "sample note 2",
            children: [6, 7]
        },
        3: {
            text: "sample note 3",
        },
        4: {
            text: "sample note 4",
        },
        5: {
            text: "sample note 5",
        },
        6: {
            text: "sample note 5",
        },
        7: {
            text: "sample note 5",
        },
    });
    let rootID = 1;
    return (
        <div className="container">
            <div className="position-relative ps-2">
                <ul className='list-unstyled'>
                    <Note notes={notes} id={rootID} />
                </ul>
            </div>
            <LexicalComposer initialConfig={editorConfig}>
                <div className="editor-container">
                    <PlainTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={<Placeholder />}
                    />
                    <OnChangePlugin onChange={onChange} />
                    <HistoryPlugin />
                    <EmoticonPlugin />
                    <MyCustomAutoFocusPlugin />
                </div>
            </LexicalComposer>
        </div>
    );
}

export default Notes;
