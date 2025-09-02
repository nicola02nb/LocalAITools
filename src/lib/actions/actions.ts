export const actions: Action[] = ["detector", "translator", "summarizer", "rewriter", "proofreader"];
export function isValidAction(action: string): action is Action {
  return actions.includes(action as Action);
}