import { $getEditor, $getNearestNodeFromDOMNode, $getNodeByKey, COMMAND_PRIORITY_LOW } from "lexical";
import { NOTES_FOCUS_COMMAND } from "./utils/commands";
import { useEffect } from "react";
import { useRemdoLexicalComposerContext } from "./ComposerContext";
import { useNavigate, useParams } from "react-router-dom";
import { isBeforeEvent } from "@/utils";
import { $isListItemNode } from "@lexical/list";
import { $getNodeByID } from "./utils/utils";

export function FocusPlugin({ anchorRef }:
  { anchorRef: React.RefObject<HTMLElement> }) {
  const [editor] = useRemdoLexicalComposerContext();
  const navigate = useNavigate();
  const { noteID } = useParams();

  useEffect(() => {
    return editor.registerCommand(
      NOTES_FOCUS_COMMAND,
      ({ key }) => {
        console.log("NOTES_FOCUS_COMMAND", key, editor.getEditorState()._nodeMap.size);
        const focusNode = $getNodeByKey(key);

        if (key == "root") {
          if (noteID) {
            navigate(`/`);
          }
        } else {
          if (!$isListItemNode(focusNode)) {
            throw new Error(`called NOTES_FOCUS_COMMAND on a non ListItemNode, key: ${key}, type: ${focusNode?.getType()}`);
          }
          if (noteID !== focusNode.getID()) {
            navigate(`/note/${focusNode.getID()}`);
          }
        }

        editor.fullUpdate(() => {
          $getEditor()._remdoState.setFocusKey(key);
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, noteID, navigate]);

  useEffect(() => {
    //focus on note given in URL once document is loaded
    if (!noteID) {
      return;
    }
    const unregister = editor.registerUpdateListener(
      ({ editorState }) => {
        const entry = Array.from(editorState._nodeMap.entries()).find(([, node]) => $isListItemNode(node) && (node).getID() === noteID);
        if (entry) {
          editor.fullUpdate(() => {
            //lexical documentation discourages using waterfall updates
            //this case is intentional though as we have to wait for the first 
            //update when nodes are loaded from YJS document
            //during such update mutation listeners are not triggered
            editor.dispatchCommand(NOTES_FOCUS_COMMAND, { key: entry[0] });
            unregister();
          });
        }
      });
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    //handle click on li::before to focus on a particular note
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
        editor.dispatchCommand(NOTES_FOCUS_COMMAND, { key: node?.getKey() });
      });
    }

    anchor.addEventListener("click", onClick);

    return () => {
      anchor.removeEventListener("click", onClick);
    };
  }, [anchorRef, editor, navigate]);

  useEffect(() => {
    editor.read(() => {
      const focusKey = $getNodeByID(noteID ?? "root")?.getKey();
      if (focusKey && $getEditor()._remdoState.getFocus()?.getKey() !== focusKey) {
        editor.dispatchCommand(NOTES_FOCUS_COMMAND, { key: focusKey });
      }
    });
  }, [editor, noteID]);

  return null;
}
