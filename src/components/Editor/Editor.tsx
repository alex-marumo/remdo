import {
  DocumentSelectorProvider,
  useDocumentSelector,
} from "../DocumentSelector";
import "./Editor.scss";
import { useEditorConfig } from "./config";
import { DevComponentTestPlugin } from "./plugins/DevComponentTestPlugin";
import { DevToolbarPlugin } from "./plugins/DevToolbarPlugin";
import { IndentationPlugin } from "./plugins/IndentationPlugin";
import { NoteControlsPlugin } from "./plugins/NoteControlsPlugin";
import NotesPlugin from "./plugins/NotesPlugin";
import { QuickMenuPlugin } from "./plugins/QuickMenuPlugin";
import { RemdoAutoLinkPlugin } from "./plugins/RemdoAutoLinkPlugin";
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
import React, { useRef } from "react";

function LexicalEditor() {
  const editorContainerRef = useRef();
  const editorBottomRef = useRef();
  const documentSelector = useDocumentSelector();
  const editorConfig = useEditorConfig();

  return (
    <LexicalComposer
      initialConfig={editorConfig}
      key={documentSelector.documentID}
    >
      <div className="editor-container editor-shell">
        <DevToolbarPlugin editorBottomRef={editorBottomRef} />
        <QuickMenuPlugin />
        <NotesPlugin
          anchorRef={editorContainerRef}
          documentID={documentSelector.documentID}
        />
        <RichTextPlugin
          contentEditable={
            <div className="editor" ref={editorContainerRef}>
              <ContentEditable className="editor-input form-control" />
            </div>
          }
          placeholder={<div />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <NoteControlsPlugin anchorRef={editorContainerRef} />
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
            id={documentSelector.documentID}
            providerFactory={documentSelector.yjsProviderFactory}
            shouldBootstrap={true}
          />
        )}
        <div id="editor-bottom" ref={editorBottomRef} />
      </div>
    </LexicalComposer>
  );
}

export default function Editor() {
  return (
    <DocumentSelectorProvider>
      <LexicalEditor />
    </DocumentSelectorProvider>
  );
}
