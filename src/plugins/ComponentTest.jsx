//TODO move to plugins and rename dirs to match case
import PropTypes from "prop-types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

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
