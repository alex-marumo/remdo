import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertBlockNode } from '@lexical/utils';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot, $getSelection, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, DecoratorNode, KEY_ENTER_COMMAND, KEY_TAB_COMMAND, TextNode } from 'lexical';
import React, { useEffect } from 'react';
import "./Notes.css"

export class EmojiNode extends TextNode {
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
  let pattern = ":)";
  const textContent = node.getTextContent().slice(-pattern.length);
  // When you type :), we will replace it with an emoji node
  //console.log("ok", textContent)
  if (textContent === pattern) {
    let p = $createParagraphNode();
    p.append($createTextNode(node.getTextContent().slice(0, -pattern.length)));
    p.append($createEmojiNode("emoji happysmile", "🙂"));
    node.replace(p);
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


export function EmoticonPlugin() {
  const [editor] = useLexicalComposerContext();
  useEmoticons(editor);
  return null;
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

export class NoteNode extends DecoratorNode {
  static getType() {
    return "note";
  }

  static clone(node) {
    return new NoteNode(node.__format, node.__key);
  }

  //constructor(format, key) {
  //  super(format, key);
  //}

  createDOM(config) {
    return document.createElement('div');
  }

  updateDOM(prevNode, dom, config) {
    const inner = dom.firstChild;
    if (inner === null) {
      return true;
    }
    super.updateDOM(prevNode, inner, config);
    return false;
  }

  decorate() {
    return <span>note6</span>;
  }
}

function $createNoteNode(className, emojiText) {
  return new NoteNode();
}

export function NotesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("registering");
    return;
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const focusNode = $getSelection().focus.getNode();
        var br = $createLineBreakNode();
        focusNode.insertAfter(br);
        var node = $createNoteNode();
        br.insertAfter(node);
        //node.select();
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  function update() {
    editor.update(() => {
      const root = $getRoot()
      root.clear();
      return;
      console.log("root", root)
      const p = $createParagraphNode();
      p.append($createTextNode('Welcome to the playground'));
      root.append(p);
    });
  }
  return <button onClick={update}>Clear</button>;
}


export function Notes(props) {
  const [notes] = React.useState({
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
    <div className="position-relative ps-2">
      <ul className='list-unstyled'>
        <Note notes={notes} id={rootID} />
      </ul>
    </div>
  );
}

export default Notes;
