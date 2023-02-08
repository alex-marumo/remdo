//TODO move to plugins and rename dirs to match case
import PropTypes from "prop-types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { CONNECTED_COMMAND, TOGGLE_CONNECT_COMMAND } from "@lexical/yjs";
import { COMMAND_PRIORITY_EDITOR } from "lexical";

export function ComponentTestPlugin({ testHandler }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!testHandler) {
      return;
    }
    console.log("in the browser");
    testHandler("sample");
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.log("reading");
        testUpdateListener();
      });
    });
  }, [editor, testHandler]);

  useEffect(() => {
    return editor.registerCommand(
      CONNECTED_COMMAND,
      payload => {
        console.log("connected", payload);
        editor.update(() => {
          console.log("reading after connection");
          testUpdateListener();
        });  
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
}

ComponentTestPlugin.propTypes = {
  testHandler: PropTypes.func,
};
