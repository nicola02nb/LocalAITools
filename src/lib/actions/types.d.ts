type Action = "detector" | "translator" | "summarizer" | "rewriter" | "proofreader";
type MessageObject = {
  action: Action;
  text: string;
};