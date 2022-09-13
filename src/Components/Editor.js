import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection } from "lexical";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { TextNode } from "lexical";
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';
import { NotesPlugin, EmojiNode, EmoticonPlugin, NoteNode } from "./Notes";
import "./Editor.css"

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

function loadContent() {
    const root = $getRoot();
    root.clear();
    const p = $createParagraphNode();
    p.append($createTextNode('Loaded node 1'));
    p.append($createTextNode('Loaded node 3'));
    root.append(p);
}

function onChange(editorState) {
    editorState.read(() => {
        //const root = $getRoot();
        //const selection = $getSelection();
        //console.log(root, selection);
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

export default function Editor() {
    const editorConfig = {
        onError(error) {
            throw error;
        },
        nodes: [EmojiNode, NoteNode],
        //editorState: loadContent,
    };
    return (
        <div className="container">
            <LexicalComposer initialConfig={editorConfig}>
                <div className="editor-container">
                    <PlainTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={<Placeholder />}
                    />
                    <OnChangePlugin onChange={onChange} />
                    <HistoryPlugin />
                    <TreeViewPlugin />
                    <EmoticonPlugin />
                    <NotesPlugin />
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