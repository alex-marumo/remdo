import { $getNearestNodeFromDOMNode, COMMAND_PRIORITY_LOW } from "lexical";
import { NOTES_FOCUS_COMMAND } from "./utils/commands";
import { useEffect } from "react";
import { useRemdoLexicalComposerContext } from "./ComposerContext";
import { useNavigate, useParams } from "react-router-dom";
import { Note } from "./utils/api";
import { isBeforeEvent } from "@/utils";

export function FocusPlugin({ anchorRef }:
  { anchorRef: React.RefObject<HTMLElement> }) {
  const [editor] = useRemdoLexicalComposerContext();
  const navigate = useNavigate();
  const locationParams = useParams();

  useEffect(() => {
    editor.registerCommand(
      NOTES_FOCUS_COMMAND,
      ({ key }) => {
        editor.fullUpdate(() => Note.from(key ?? "root").focus());
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  });

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        target.tagName.toLowerCase() !== "li" ||
        !isBeforeEvent(target, event)
      ) {
        return;
      }
      //TODO read or just passing editor state should be enough, re-check in a newer lexical version
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(target);
        if (node) {
          const key = node.getKey();
          navigate(`/note/${key}`);
        }
      });
    }

    anchor.addEventListener("click", onClick);

    return () => {
      anchor.removeEventListener("click", onClick);
    };
  }, [anchorRef, editor, navigate]);

  useEffect(() => {
    const key = locationParams["noteID"];
    editor.dispatchCommand(NOTES_FOCUS_COMMAND, { key });
  }, [editor, locationParams]);

  return null;
}
