import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { NotesPlugin } from "./Notes";

import "./Editor.css";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";
import { useState } from "react";
import IndentOncePlugin from "../plugins/IndentOncePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TypeaheadPlugin } from "./Typeahead";
import { getActiveEditorState } from "@lexical/LexicalUpdates";
import { $getNodeByKey, TextNode } from "lexical";

function providerFactory(id, yjsDocMap) {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }
  return new WebsocketProvider("ws://athena:8080", "notes/0/" + id, doc, {
    connect: false,
  });
}

function Placeholder() {
  return <div className="editor-placeholder">Enter some plain text...</div>;
}

function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();
  return (
    <TreeView
      viewClassName="tree-view-output"
      timeTravelPanelClassName="invisible"
      timeTravelButtonClassName="invisible"
      timeTravelPanelSliderClassName="invisible"
      timeTravelPanelButtonClassName="invisible"
      editor={editor}
    />
  );
}

function createNodeReplacement(replacedType, cloneFunction) {
  class NotesNode extends replacedType {
    static getType() {
      return "Notes" + super.getType();
    }
    static clone(node) {
      return cloneFunction({ node: node, type: NotesNode, skipKey: false });
    }
    static importJSON(serializedNode) {
      return super.importJSON(serializedNode);
    }
    exportJSON() {
      return super.exportJSON();
    }
    createDOM(config, editor) {
      const state = editor.getEditorState();
      const key = this.getKey();
      const tempRootKey = state._tempRootKey || "root";
      const tempRootParentKey = state._tempRootParentKey || null;

      if (
        tempRootKey === "root" ||
        key === tempRootKey ||
        key === tempRootParentKey
      ) {
        return super.createDOM(config, editor);
      } else if ($getNodeByKey(key)?.getParentKeys().includes(tempRootKey)) {
        return super.createDOM(config, editor);
      }
      return document.createElement("div");
    }
    updateDOM(prevNode, dom, config) {
      const state = getActiveEditorState();
      //updateDOM has to be placed first as it may have some side effects
      return super.updateDOM(prevNode, dom, config) || state._tempRootChanged;
    }
  }
  return [
    NotesNode,
    {
      replace: replacedType,
      with: (node) =>
        cloneFunction({ node: node, type: NotesNode, skipKey: true }),
    },
  ];
}

export default function Editor() {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const editorConfig = {
    onError(error) {
      throw error;
    },
    nodes: [
      ...createNodeReplacement(
        ListItemNode,
        ({ node, type, skipKey }) =>
          new type(
            node.__value,
            node.__checked,
            skipKey ? undefined : node.__key
          )
      ),
      ...createNodeReplacement(
        ListNode,
        ({ node, type, skipKey }) =>
          new type(
            node.__listType,
            node.__start,
            skipKey ? undefined : node.__key
          )
      ),
      ...createNodeReplacement(
        TextNode,
        ({ node, type, skipKey }) =>
          new type(node.__text, skipKey ? undefined : node.__key)
      ),
    ],
    theme: {
      list: {
        nested: {
          listitem: "position-relative li-nested",
        },
        ol: "editor-list-ol",
        //ul: 'list-unstyled',
        //listitem: 'position-relative',
      },
    },
    editorState: null,
    disableCollab: !!import.meta.env.VITE_DISABLECOLLAB,
  };

  return (
    <div className="container">
      <br />
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-container editor-shell">
          {floatingAnchorElem && (
            <NotesPlugin anchorElement={floatingAnchorElem} />
          )}
          <TypeaheadPlugin />
          <RichTextPlugin
            contentEditable={
              <div className="editor" ref={onRef}>
                <ContentEditable className="editor-input form-control" />
              </div>
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ClearEditorPlugin />
          <ListPlugin />
          <AutoFocusPlugin />
          <TabIndentationPlugin />
          <IndentOncePlugin />
          <TreeViewPlugin />
          {editorConfig.disableCollab ? (
            <HistoryPlugin />
          ) : (
            <CollaborationPlugin
              id="main"
              providerFactory={providerFactory}
              shouldBootstrap={true}
            />
          )}
        </div>
      </LexicalComposer>
    </div>
  );
}
