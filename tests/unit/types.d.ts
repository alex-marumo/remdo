import { LexicalEditor } from "lexical";
import { RenderResult } from "@testing-library/react";

declare module "vitest" {
  export interface TestContext {
    editor?: LexicalEditor;
    component?: RenderResult;
  }
}
