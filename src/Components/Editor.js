import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { NotesPlugin, HoveredNoteIcon } from "./Notes";

import "./Editor.css"
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';
import { useState } from "react";

function createWebsocketProvider(id, yjsDocMap,) {
    let doc = yjsDocMap.get(id);

    if (doc === undefined) {
        doc = new Doc();
        yjsDocMap.set(id, doc);
    } else {
        doc.load();
    }
    return new WebsocketProvider('ws://athena:8080', 'notes/0/' + id, doc, { connect: false, },);
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

export default function Editor() {
    const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

    const onRef = (_floatingAnchorElem) => {
        console.log("test1");
        if (_floatingAnchorElem !== null) {
            console.log("test2");
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const editorConfig = {
        onError(error) {
            throw error;
        },
        nodes: [HoveredNoteIcon, ListNode, ListItemNode],
        theme: {
            list: {
                nested: {
                    listitem: 'position-relative',
                },
                ol: 'editor-list-ol',
                //ul: 'list-unstyled',
                //listitem: 'position-relative',
            },
        },
        editorState: null,
    };
    return (
        <div className="container">
            <br />
            <LexicalComposer initialConfig={editorConfig}>
                <div className="editor-container">
                    <RichTextPlugin
                        contentEditable={<div className="editor" ref={onRef}>
                            <ContentEditable className="editor-input" />
                        </div>}
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <ListPlugin />
                    <AutoFocusPlugin />
                    <HistoryPlugin />
                    <TreeViewPlugin />
                    {
                        floatingAnchorElem &&
                        <NotesPlugin anchorElement={floatingAnchorElem} />
                    }
                    <CollaborationPlugin
                        id="main"
                        providerFactory={createWebsocketProvider}
                        shouldBootstrap={true}
                    />
                </div>
            </LexicalComposer>
        </div>
    );
}