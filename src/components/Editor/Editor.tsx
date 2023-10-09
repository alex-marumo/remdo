import "./Editor.scss";
import { editorConfig } from "./config";
import { DevComponentTestPlugin } from "./plugins/DevComponentTestPlugin";
import { DevToolbarPlugin } from "./plugins/DevToolbarPlugin";
import { IndentationPlugin } from "./plugins/IndentationPlugin";
import NotesPlugin from "./plugins/NotesPlugin";
import { QuickMenuPlugin } from "./plugins/QuickMenuPlugin";
import { RemdoAutoLinkPlugin } from "./plugins/RemdoAutoLinkPlugin";
import { providerFactory } from "./yjsProvider";
import FloatingTextFormatToolbarPlugin from "@lexical/playground/plugins/FloatingTextFormatToolbarPlugin";
import "@lexical/playground/plugins/FloatingTextFormatToolbarPlugin/index.css";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import LexicalClickableLinkPlugin from "@lexical/react/LexicalClickableLinkPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { useState } from "react";
import React from "react";
import { useLocation } from "react-router-dom";

export default function Editor() {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  const [editorBottom, setEditorBottom] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const documentID = params.get("documentID") || "main";

  const onRef = (_floatingAnchorElem: HTMLElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container editor-shell">
        <DevToolbarPlugin editorBottom={editorBottom} />
        {floatingAnchorElem && (
          <NotesPlugin
            anchorElement={floatingAnchorElem}
            documentID={documentID}
          />
        )}
        <QuickMenuPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor" ref={onRef}>
              <ContentEditable className="editor-input form-control" />
            </div>
          }
          placeholder={<div />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <DevComponentTestPlugin />
        <FloatingTextFormatToolbarPlugin />
        <ClearEditorPlugin />
        <ListPlugin />
        <LinkPlugin />
        <RemdoAutoLinkPlugin />
        <LexicalClickableLinkPlugin />
        <TabIndentationPlugin />
        <IndentationPlugin />
        {editorConfig.disableCollab ? (
          <HistoryPlugin />
        ) : (
          <CollaborationPlugin
            id={documentID}
            providerFactory={providerFactory}
            shouldBootstrap={true}
          />
        )}
        <div id="editor-bottom" ref={setEditorBottom} />
      </div>
    </LexicalComposer>
  );
}
