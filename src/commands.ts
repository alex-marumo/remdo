import { createCommand, LexicalCommand } from "lexical";

export const NOTES_FOLD_COMMAND: LexicalCommand<void> =
  createCommand("NOTES_FOLD_COMMAND");

export const NOTES_FOLD_TO_LEVEL_COMMAND: LexicalCommand<void> = createCommand(
  "NOTES_FOLD_TO_LEVEL_COMMAND"
);

export const NOTES_MOVE_COMMAND: LexicalCommand<void> =
  createCommand("NOTES_FOLD_COMMAND");

export const NOTES_SEARCH_COMMAND: LexicalCommand<void> =
  createCommand("NOTES_FOLD_COMMAND");
