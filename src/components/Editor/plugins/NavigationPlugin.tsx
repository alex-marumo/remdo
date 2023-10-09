import { COMMAND_PRIORITY_LOW } from "lexical";
import { NOTES_FOCUS_COMMAND } from "../commands";
import { useNotesLexicalComposerContext } from "../NotesComposerContext";
import { Note, NotesState } from "../api";
import { isBeforeEvent } from "@/utils";
import { ListItemNode } from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import { $getNearestNodeFromDOMNode } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Dropdown from "react-bootstrap/Dropdown";
import { useNavigate, useParams } from "react-router-dom";

export function Navigation({ anchorElement, documentID }) {
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
            [note, ...note.parents]
              .slice(0, -1) //skip root
              .reverse()
              .map(p => ({
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
          navigate(`/note/${key}`);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  });

  const breadcrumbItems = breadcrumbs.map(
    ({ key, text }, index, { length }) => (
      <Breadcrumb.Item
        key={key}
        href={`/note/${key}`}
        active={index === length - 1}
      >
        {key === "root" ? "Document" : text}
      </Breadcrumb.Item>
    )
  );

  const documents = NotesState.documents().map(document => (
    <Dropdown.Item href={`?documentID=${document}`} key={document}>
      {document}
    </Dropdown.Item>
  ));

  //TODO https://react-bootstrap.github.io/components/dropdowns/#custom-dropdown-components
  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Item linkAs="div">
          <Dropdown>
            <Dropdown.Toggle variant="dark" size="sm" id="dropdown-basic">
              {documentID}
            </Dropdown.Toggle>

            <Dropdown.Menu variant="dark">{documents}</Dropdown.Menu>
          </Dropdown>
        </Breadcrumb.Item>
        {breadcrumbItems}
      </Breadcrumb>
    </div>
  );
}
