import { useNotesLexicalComposerContext } from "../NotesComposerContext";
import { useDebug } from "@/DebugContext";
import TreeViewPlugin from "@lexical/playground/plugins/TreeViewPlugin";
import { mergeRegister } from "@lexical/utils";
import { CONNECTED_COMMAND, TOGGLE_CONNECT_COMMAND } from "@lexical/yjs";
import {
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

function EditorStateInput() {
  const [editor] = useNotesLexicalComposerContext();
  const loadEditorState = () => {
    const editorStateElement: HTMLTextAreaElement = document.getElementById(
      "editor-state"
    ) as HTMLTextAreaElement;
    const serializedEditorState = editorStateElement.value;
    const editorState = editor.parseEditorState(serializedEditorState);
    editor.setEditorState(editorState);
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, null);
    editorStateElement.value = "";
  };

  return (
    <div>
      <textarea id="editor-state"></textarea>
      <br />
      <button
        type="button"
        className="btn btn-primary"
        onClick={loadEditorState}
      >
        Submit Editor State
      </button>
    </div>
  );
}

export const DevToolbarPlugin = ({ editorBottomRef }) => {
  const [connected, setConnected] = useState(false);
  const [editor] = useNotesLexicalComposerContext();
  const [darkMode, setDarkMode] = useState(getDarkMode());
  const [showEditorStateInput, setShowEditorStateInput] = useState(false);
  const { isDebugMode } = useDebug();
  const editorBottom = editorBottomRef.current;

  useEffect(() => {
    //the idea is to use it in browser console
    globalThis.debugEditor = editor;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<boolean>(
        CONNECTED_COMMAND,
        (payload) => {
          const isConnected = payload;
          setConnected(isConnected);
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  function getDarkMode() {
    return document.documentElement.dataset.bsTheme === "dark";
  }

  const clearContent = () => {
    editor.update(() => {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
    });
  };

  const toggleEditorStateInput = (event) => {
    event.preventDefault();
    setShowEditorStateInput(!showEditorStateInput);
  };

  const toggleColorMode = useCallback(() => {
    document.documentElement.dataset.bsTheme = darkMode ? "light" : "dark";
    setDarkMode(getDarkMode());
  }, [darkMode]);

  return (
    isDebugMode && <div
      className="d-none d-lg-block"
    >
      <button
        type="button"
        className="btn btn-link float-end"
        onClick={toggleColorMode}
      >
        <i
          className={`bi bi-${
            darkMode ? "sun-fill" : "moon-stars-fill"
          } text-secondary`}
        ></i>
        {darkMode ? "Light" : "Dark"} Mode
      </button>
      <button
        type="button"
        className="btn btn-link float-end"
        onClick={clearContent}
      >
        Clear
      </button>
      <button
        type="button"
        className="btn btn-link float-end"
        onClick={toggleEditorStateInput}
      >
        Load State
      </button>
      {editorBottom &&
        showEditorStateInput &&
        createPortal(<EditorStateInput />, editorBottom)}
      {editorBottom &&
        isDebugMode &&
        createPortal(<TreeViewPlugin />, editorBottom)}
      <button
        type="button"
        className="btn btn-link float-end"
        onClick={() => {
          editor.dispatchCommand(TOGGLE_CONNECT_COMMAND, !connected);
        }}
      >
        {connected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
};
