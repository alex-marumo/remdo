import { useRemdoLexicalComposerContext } from "../ComposerContext";
import { Note } from "../api";
import { NOTES_FOCUS_COMMAND } from "../commands";
import { DocumentSelector } from "../DocumentSelector/DocumentSelector";
import { isBeforeEvent } from "@/utils";
import { ListItemNode } from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { $getNearestNodeFromDOMNode } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { useNavigate, useParams } from "react-router-dom";

export function Navigation({ anchorRef, documentID }) {
  const [editor] = useRemdoLexicalComposerContext();
  const navigate = useNavigate();
  const locationParams = useParams();
  const rootRef = useRef("");

  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const setFocus = useCallback(
    (key: string) => {
      editor.fullUpdate(
        () => {
          const note = Note.from(key);
          rootRef.current = note.lexicalKey;
          note.focus();

          //TODO won't update if path is changed elsewhere
          setBreadcrumbs(
            [note, ...note.parents]
              .slice(0, -1) //skip root
              .reverse()
              .map((note) => ({
                text: note.text,
                key: note.lexicalKey,
                focus: () =>
                  editor.fullUpdate(() => note.focus(), { discrete: true }),
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

    anchorRef?.current?.addEventListener("click", onClick);

    return () => {
      anchorRef?.current?.removeEventListener("click", onClick);
    };
  }, [anchorRef, editor, navigate]);

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(ListItemNode, (mutatedNodes) => {
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
          navigate(`/note/${key}`);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  });

  const breadcrumbItems = breadcrumbs.map(
    ({ text, key, focus }, index, { length }) => (
      <Breadcrumb.Item
        key={key}
        onClick={() => {
          navigate(`/note/${key}`);
          focus();
        }}
        active={index === length - 1}
      >
        {text}
      </Breadcrumb.Item>
    )
  );

  return (
    <div>
      <Breadcrumb id="notes-path">
        <Breadcrumb.Item linkAs="div">
          <DocumentSelector />
        </Breadcrumb.Item>
        <Breadcrumb.Item
          onClick={() => {
            navigate("/");
            editor.fullUpdate(() => Note.from("root").focus(), {
              discrete: true,
            });
          }}
        >
          {documentID}
        </Breadcrumb.Item>
        {breadcrumbItems}
      </Breadcrumb>
    </div>
  );
}
