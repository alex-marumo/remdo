import PropTypes from "prop-types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $getRoot } from "lexical";

export function ComponentTestPlugin({ testHandler }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!testHandler) {
      return;
    }
    console.log("in the bworser");
    testHandler("sample");
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.log("reading");
        testUpdateListener();
      });
    });
  }, [editor, testHandler]);
}

ComponentTestPlugin.propTypes = {
  testHandler: PropTypes.object,
};
