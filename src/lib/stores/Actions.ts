export type Action =
  | "detector"
  | "translator"
  | "summarizer"
  | "rewriter"
  | "proofreader";
export type MessageObject = {
  action: Action;
  text: string;
};
export const actions: Action[] = [
  "detector",
  "translator",
  "summarizer",
  "rewriter",
  "proofreader",
];
export function isValidAction(action: string): action is Action {
  return actions.includes(action as Action);
}
