import { BreadcrumbPlugin } from "./remdo/BreadcrumbsPlugin";
import { SearchPlugin } from "./remdo/SearchPlugin";
import "./RemdoPlugin.scss";
import { ListItemNode } from "@lexical/list";
import { ListNode } from "@lexical/list";
import { TextNode } from "lexical";
import { applyNodePatches } from "./remdo/utils/patches";
import { FocusPlugin } from "./remdo/FocusPlugin";
import { ReorderPlugin } from "./remdo/ReorderPlugin";
import { InsertParagraphPlugin } from "./remdo/InsertParagraphPlugin";
import { FoldPlugin } from "./remdo/FoldPlugin";
import { FixRootPlugin } from "./remdo/FixRootPlugin";
import { CheckPlugin } from "./remdo/CheckPlugin";
import { BackspacePlugin } from "./remdo/BackspacePlugin";

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
