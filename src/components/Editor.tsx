import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ComponentTestPlugin } from "../plugins/ComponentTest";

import "./Editor.css";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";
import { useState } from "react";
import IndentationPlugin from "../plugins/IndentationPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TextNode } from "lexical";
import React from "react";
import { NotesPlugin } from "@/plugins/Notes";
import { applyNodePatches } from "@/lexicalNodes";
import { NoteMenuPlugin } from "@/plugins/NoteMenuPlugin";

function providerFactory(id, yjsDocMap) {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }
  const wsProvider = new WebsocketProvider(
    "ws://athena:8080",
    "notes/0/" + id,
    doc,
    {
      connect: false,
    }
  );
  wsProvider.shouldConnect = true; //reconnect after disconnecting
  return wsProvider;
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

applyNodePatches(TextNode);
applyNodePatches(ListNode);
applyNodePatches(ListItemNode);

export default function Editor() {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

  const onRef = _floatingAnchorElem => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const editorConfig = {
    onError(error) {
      throw error;
    },
    namespace: "notes",
    nodes: [ListItemNode, ListNode],
    theme: {
      list: {
        nested: {
          listitem: "position-relative li-nested",
        },
        ol: "editor-list-ol",
      },
    },
    editorState: null,
    //@ts-ignore
    disableCollab: !!import.meta.env.VITE_DISABLECOLLAB,
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container editor-shell">
        {floatingAnchorElem && (
          <NotesPlugin anchorElement={floatingAnchorElem} />
        )}
        <NoteMenuPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor" ref={onRef}>
              <ContentEditable className="editor-input form-control" />
            </div>
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ComponentTestPlugin />
        <ClearEditorPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <IndentationPlugin />
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
  );
}
