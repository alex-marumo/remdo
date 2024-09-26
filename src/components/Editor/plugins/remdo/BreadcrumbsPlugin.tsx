import { useRemdoLexicalComposerContext } from "./ComposerContext";
import { Note } from "./utils/api";
import { useEffect, useState } from "react";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import { DocumentSelector } from "@/components/Editor/DocumentSelector/DocumentSelector";

type Breadcrumb = {
  text: string;
  key: string;
};

export function BreadcrumbPlugin({ documentID }: { documentID: string }) {
  const [editor] = useRemdoLexicalComposerContext();
  const locationParams = useParams();

  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  useEffect(() => {
    const key = locationParams["noteID"];
    editor.fullUpdate(() => {
      const note = Note.from(key ?? "root");

      setBreadcrumbs(
        [note, ...note.parents]
          .slice(0, -1) //skip root
          .reverse()
          .map((note) => ({
            text: note.text,
            key: note.lexicalKey,
          }))
      );
    });
  }, [editor, locationParams]);

  const breadcrumbItems = breadcrumbs.map(
    ({ text, key }, index, { length }) => (
      <Breadcrumb.Item
        key={key}
        active={index === length - 1}
        linkAs={Link}
        linkProps={{ to: `/note/${key}` }}
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
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          {documentID}
        </Breadcrumb.Item>
        {breadcrumbItems}
      </Breadcrumb>
    </div>
  );
}
