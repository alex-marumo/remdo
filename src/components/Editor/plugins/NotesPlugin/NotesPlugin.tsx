import { BreadcrumbPlugin } from "../BreadcrumbsPlugin";
import { SearchPlugin } from "../SearchPlugin";
import "./NotesPlugin.scss";
import { ListItemNode } from "@lexical/list";
import { ListNode } from "@lexical/list";
import { TextNode } from "lexical";
import { applyNodePatches } from "./utils/patches";
import { FocusPlugin } from "../FocusPlugin";
import { ReorderPlugin } from "../ReorderPlugin";
import { InsertParagraphPlugin } from "../InsertParagraphPlugin";
import { FoldPlugin } from "../FoldPlugin";
import { FixRootPlugin } from "../FixRootPlugin";
import { CheckPlugin } from "../CheckPlugin";
import { BackspacePlugin } from "../BackspacePlugin";

applyNodePatches(TextNode);
applyNodePatches(ListNode);
applyNodePatches(ListItemNode);

export function NotesPlugin({ anchorRef, documentID }:
  { anchorRef: React.RefObject<HTMLElement>; documentID: string }) {

  return (
    <>
      <BreadcrumbPlugin documentID={documentID} />
      <FocusPlugin anchorRef={anchorRef} />
      <ReorderPlugin />
      <InsertParagraphPlugin />
      <SearchPlugin />
      <FoldPlugin />
      <FixRootPlugin />
      <CheckPlugin />
      <BackspacePlugin />
    </>
  );
}
