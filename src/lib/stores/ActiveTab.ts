import { writable } from "svelte/store";

export type AiTab =
  | "prompt"
  | "detector"
  | "translator"
  | "summarizer"
  | "writer"
  | "rewriter"
  | "proofreader";
export type TabName = AiTab | "home" | "settings";
export const tabs: TabName[] = [
  "home",
  "prompt",
  "detector",
  "translator",
  "summarizer",
  "writer",
  "rewriter",
  "proofreader",
  "settings",
];
export const tabNames = {
  home: "Home",
  prompt: "Prompt",
  detector: "LanguageDetector",
  translator: "Translator",
  summarizer: "Summarizer",
  writer: "Writer",
  rewriter: "Rewriter",
  proofreader: "Proofreader",
  settings: "Settings",
};
export const tabActions = {
  prompt: "Send",
  detector: "Detect",
  translator: "Translate",
  summarizer: "Summarize",
  writer: "Write",
  rewriter: "Rewrite",
  proofreader: "Proofread",
};
export const apiDocs = {
  prompt: "https://github.com/webmachinelearning/prompt-api",
  detector: "https://github.com/webmachinelearning/detector-api",
  translator: "https://github.com/webmachinelearning/translation-api",
  summarizer: "https://github.com/webmachinelearning/writing-assistance-apis",
  writer: "https://github.com/webmachinelearning/writing-assistance-apis",
  rewriter: "https://github.com/webmachinelearning/writing-assistance-apis",
  proofreader: "https://github.com/webmachinelearning/proofreader-api",
};

export const activeTab = writable<TabName>("home");

if (chrome?.storage?.local) {
  chrome.storage.local.get("activeTab").then((result) => {
    if (result.activeTab) {
      activeTab.set(result.activeTab);
    }
  });
  activeTab.subscribe((value) => {
    chrome.storage.local.set({ activeTab: value });
  });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      const action: AiTab = request.action;
      activeTab.set(action);
      sendResponse({ status: "success" });
    },
  );
} else if (self.localStorage) {
  const storedActiveTab = localStorage.getItem("activeTab") as TabName | null;
  if (storedActiveTab) {
    activeTab.set(storedActiveTab);
  }
  activeTab.subscribe((value) => {
    localStorage.setItem("activeTab", value);
  });
}
