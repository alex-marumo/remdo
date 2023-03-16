import { DevComponentTestPlugin } from "./plugins/DevComponentTestPlugin";
import IndentationPlugin from "./plugins/IndentationPlugin";
import "./Editor.scss";
import { applyNodePatches } from "./lexical/nodes";
import { DevToolbarPlugin } from "./plugins/DevToolbarPlugin";
import { QuickMenuPlugin } from "./plugins/QuickMenuPlugin";
import { NotesPlugin } from "./plugins/NotesPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import "@lexical/playground/index.css";
import FloatingTextFormatToolbarPlugin from "@lexical/playground/plugins/FloatingTextFormatToolbarPlugin";
import "@lexical/playground/plugins/FloatingTextFormatToolbarPlugin/index.css";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { Provider } from "@lexical/yjs";
import { TextNode } from "lexical";
import { useState } from "react";
import React from "react";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

function providerFactory(id: string, yjsDocMap: Map<string, Doc>): Provider {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  const idbProvider = new IndexeddbPersistence(id, doc);

  idbProvider.on("synced", () => {
    console.log("local db synced");
  });

  const wsProvider = new WebsocketProvider(
    "ws://athena:8080",
    "notes/0/" + id,
    doc,
    {
      connect: false,
    }
  );
  wsProvider.shouldConnect = true; //reconnect after disconnecting
  // @ts-ignore
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
  const [editorBottom, setEditorBottom] = useState(null);

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
      text: {
        bold: "font-weight-bold",
        code: "",
        italic: "font-italic",
        strikethrough: "strikethrough",
        subscript: "subscript",
        superscript: "superscript",
        underline: "underline",
        underlineStrikethrough: "underline strikethrough",
      },
    },
    editorState: null,
    //@ts-ignore
    disableCollab: !!import.meta.env.VITE_DISABLECOLLAB,
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container editor-shell">
        <DevToolbarPlugin editorBottom={editorBottom} />
        {floatingAnchorElem && (
          <NotesPlugin anchorElement={floatingAnchorElem} />
        )}
        <QuickMenuPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor" ref={onRef}>
              <ContentEditable className="editor-input form-control" />
            </div>
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <DevComponentTestPlugin />
        <FloatingTextFormatToolbarPlugin />
        <ClearEditorPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <IndentationPlugin />
        {editorConfig.disableCollab ? (
          <HistoryPlugin />
        ) : (
          <CollaborationPlugin
            id="main"
            providerFactory={providerFactory}
            shouldBootstrap={true}
          />
        )}
        <div id="editor-bottom" ref={setEditorBottom} />
      </div>
    </LexicalComposer>
  );
}
