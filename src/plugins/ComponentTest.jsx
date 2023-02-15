//TODO move to plugins and rename dirs to match case
import PropTypes from "prop-types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useContext, createContext } from "react";

export const TestContext = createContext(null);

export function ComponentTestPlugin() {
  const [editor] = useLexicalComposerContext();
  const testContext = useContext(TestContext);

  useEffect(() => {
    if (!testContext) {
      return;
    }
    testContext.testHandler(editor);
  }, [editor, testContext]);
}
