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
    testHandler(editor);
  }, [editor, testHandler]);
}

ComponentTestPlugin.propTypes = {
  testHandler: PropTypes.func,
};
