import { COMMAND_PRIORITY_LOW } from "../../../../lexical/packages/lexical/src/LexicalEditor";
import { NOTES_FOCUS_COMMAND } from "../commands";
import { useNotesLexicalComposerContext } from "../lexical/NotesComposerContext";
import { Note } from "../lexical/api";
import { isBeforeEvent } from "@/utils";
import { ListItemNode } from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import { $getNearestNodeFromDOMNode } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export function Navigation({ anchorElement }) {
  const [editor] = useNotesLexicalComposerContext();
  const navigate = useNavigate();
  const locationParams = useParams();
  const rootRef = useRef("");

  const [breadcrumbs, setBreadcrumbs] = useState([
    { key: "root", text: "ToDo" },
  ]);

  const setFocus = useCallback(
    (key: string) => {
      editor.fullUpdate(
        () => {
          const note = Note.from(key);
          rootRef.current = note.lexicalKey;
          note.focus();

          //TODO won't update if path is changed elsewhere
          setBreadcrumbs(
            [note, ...note.parents].reverse().map(p => ({
              key: p.lexicalNode.getKey(),
              text: p.text,
            }))
          );
        },
        { discrete: true }
      );
    },
    [editor]
  );

  useEffect(() => {
    setFocus(locationParams["noteID"]);
  }, [setFocus, locationParams]);

  useEffect(() => {
    function onClick(event: React.MouseEvent<HTMLElement>) {
      const target = event.target as HTMLElement;
      if (
        target.tagName.toLowerCase() !== "li" ||
        !isBeforeEvent(target, event as unknown as MouseEvent) //TODO remove cast
      ) {
        return;
      }
      let key: string;
      //TODO read or just passing editor state should be enough, re-check in a newer lexical version
      editor.update(() => {
        key = $getNearestNodeFromDOMNode(target).getKey();
      });
      navigate(`/note/${key}`);
    }

    anchorElement?.addEventListener("click", onClick);

    return () => {
      anchorElement?.removeEventListener("click", onClick);
    };
  }, [anchorElement, editor, navigate]);

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(ListItemNode, mutatedNodes => {
        const { noteID } = locationParams;
        if (
          //TODO re-check
          rootRef.current !== noteID &&
          mutatedNodes.get(noteID) === "created"
        ) {
          setFocus(noteID);
        }
      }),
      editor.registerCommand(
        NOTES_FOCUS_COMMAND,
        ({ key }) => {
          setFocus(key);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  });

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        {breadcrumbs.map((note, idx, { length }) => {
          return idx + 1 < length ? (
            <li className="breadcrumb-item" key={note.key}>
              <Link to={`/note/${note.key}`}>{note.text}</Link>
            </li>
          ) : (
            <li
              className="breadcrumb-item active"
              aria-current="page"
              key={note.key}
            >
              {note.text}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
