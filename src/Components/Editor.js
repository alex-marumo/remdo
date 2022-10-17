import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { NotesPlugin, NoteNode } from "./Notes";

import "./Editor.css"
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';

/*
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';

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
*/

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
        nodes: [NoteNode, ListNode, ListItemNode],
        theme: {
            list: {
                nested: {
                  listitem: 'position-relative',
                },
                ol: 'editor-list-ol',
                //ul: 'list-unstyled',
                listitem: 'position-relative',
              },
        },
        //editorState: loadContent,
    };
    return (
        <div className="container">
            <br />
            <LexicalComposer initialConfig={editorConfig}>
                <div className="editor-container">
                    <RichTextPlugin
                        contentEditable={<div className="editor">
                            <ContentEditable className="editor-input" />
                        </div>}
                        placeholder={<Placeholder />}
                    />
                    <ListPlugin />
                    <AutoFocusPlugin />
                    <HistoryPlugin />
                    <TreeViewPlugin />
                    <NotesPlugin />
                    {/*<CollaborationPlugin
                        id="main"
                        providerFactory={createWebsocketProvider}
                        shouldBootstrap={true}
                    />*/}
                </div>

            </LexicalComposer>
        </div>
    );
}