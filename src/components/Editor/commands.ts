import { Note } from "./lexical/api";
import { createCommand, LexicalCommand } from "lexical";

export const NOTES_TOGGLE_FOLD_COMMAND: LexicalCommand<{ noteKeys: string[] }> =
  createCommand("NOTES_TOGGLE_FOLD_COMMAND");

export const NOTES_FOLD_TO_LEVEL_COMMAND: LexicalCommand<void> = createCommand(
  "NOTES_FOLD_TO_LEVEL_COMMAND"
);

export const NOTES_MOVE_COMMAND: LexicalCommand<void> =
  createCommand("NOTES_MOVE_COMMAND");

export const NOTES_SEARCH_COMMAND: LexicalCommand<void> = createCommand(
  "NOTES_SEARCH_COMMAND"
);

export const NOTES_OPEN_QUICK_MENU: LexicalCommand<{
  x: number;
  y: number;
  noteKeys: string[];
}> = createCommand("NOTES_OPEN_QUICK_MENU");

export const NOTES_FOCUS_COMMAND: LexicalCommand<{ key: string }> =
  createCommand("NOTES_FOCUS_COMMAND");
