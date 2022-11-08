import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { NotesPlugin } from "./Notes";

import "./Editor.css"
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';
import { useRef, useState } from "react";

function providerFactory(yjsDataRef) {
    function createWebsocketProvider(id, yjsDocMap,) {
        let doc = yjsDocMap.get(id);

        if (doc === undefined) {
            doc = new Doc();
            yjsDocMap.set(id, doc);
        } else {
            doc.load();
        }
        yjsDataRef.current = {
            "map": yjsDocMap,
            "doc": doc,
        };
        return new WebsocketProvider('ws://athena:8080', 'notes/0/' + id, doc, { connect: false, },);
    }
    return createWebsocketProvider;
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
    const yjsDataRef = useRef(null);

    const onRef = (_floatingAnchorElem) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const editorConfig = {
        onError(error) {
            throw error;
        },
        nodes: [ListNode, ListItemNode],
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
                    {
                        floatingAnchorElem &&
                        <NotesPlugin anchorElement={floatingAnchorElem} yjsDataRef={yjsDataRef} />
                    }
                    <TreeViewPlugin />
                    <CollaborationPlugin
                        id="main"
                        providerFactory={providerFactory(yjsDataRef)}
                        shouldBootstrap={true}
                    />
                </div>
            </LexicalComposer>
        </div>
    );
}