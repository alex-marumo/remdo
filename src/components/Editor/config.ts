import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { InitialConfigType } from "@lexical/react/LexicalComposer";

export const editorConfig: InitialConfigType & { disableCollab: boolean } = {
  onError(error: any) {
    throw error;
  },
  namespace: "notes",
  nodes: [ListItemNode, ListNode, LinkNode, AutoLinkNode],
  theme: {
    list: {
      listitemChecked: "li-checked",
      ol: "editor-list-ol",
    },
    text: {
      bold: "font-weight-bold",
      code: "",
      italic: "font-italic",
      strikethrough: "strikethrough",
      subscript: "subscript",
      superscript: "superscript",
      underline: "underline",
      underlineStrikethrough: "underline strikethrough",
    },
  },
  editorState: null,
  disableCollab: !!(import.meta as any).env.VITE_DISABLECOLLAB,
};
