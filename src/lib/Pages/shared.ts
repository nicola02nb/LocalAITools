import { writable } from "svelte/store";

export type AiTab =
  | "lm"
  | "summarizer"
  | "detector"
  | "translator"
  | "writer"
  | "rewriter";

export const tabs = [
  "home",
  "lm",
  "summarizer",
  "detector",
  "translator",
  "writer",
  "rewriter",
  "settings",
];

export const tabNames = {
  home: "Home",
  lm: "LanguageModel",
  summarizer: "Summarizer",
  detector: "LanguageDetector",
  translator: "Translator",
  writer: "Writer",
  rewriter: "Rewriter",
  settings: "Settings",
};

export const tabActions = {
  lm: "Send",
  summarizer: "Summarize",
  detector: "Detect",
  translator: "Translate",
  writer: "Write",
  rewriter: "Rewrite",
};

export type TabName = (typeof tabs)[number];
export const activeTab = writable<TabName>("home");

interface Settings {
  [key: string]: string | number | boolean;
}
interface GlobalSettings {
  sharedSidepanel: boolean;
  streamOutput: boolean;
  delayForStream: number;
  lmMultimodal: boolean;
}

interface Input {
  [key: string]: string;
}

export const inputs = writable<{ [key: string]: Input }>({});
export const settings = writable<{ [key: string]: Settings }>({});
export const generalSettings = writable<GlobalSettings>({
  sharedSidepanel: true,
  streamOutput: true,
  delayForStream: 25,
  lmMultimodal: false,
});

if (chrome?.storage?.local) {
  chrome.storage.local.get("activeTab").then((result) => {
    if (result.activeTab) {
      activeTab.set(result.activeTab);
    }
  });
  activeTab.subscribe((value) => {
    chrome.storage.local.set({ activeTab: value });
  });

  chrome.storage.local.get("generalSettings").then((result) => {
    if (result.generalSettings) {
      generalSettings.set(result.generalSettings);
    }
  });
  generalSettings.subscribe((value) => {
    chrome.storage.local.set({ generalSettings: value });
  });

  chrome.storage.local.get("settings").then((result) => {
    if (result.settings) {
      settings.set(result.settings);
    }
  });
  settings.subscribe((value) => {
    chrome.storage.local.set({ settings: value });
  });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      const action: string = request.action;
      activeTab.set(action);
      inputs.update((currentInputs) => ({
        ...currentInputs,
        [action]: {
          ...currentInputs[action],
          [action + "-text"]: request.text,
        },
      }));
      sendResponse({ status: "success" });
    },
  );
} else if (self.localStorage) {
  const storedActiveTab = localStorage.getItem("activeTab");
  if (storedActiveTab) {
    activeTab.set(storedActiveTab);
  }
  activeTab.subscribe((value) => {
    localStorage.setItem("activeTab", value);
  });

  const storedGeneralSettings = localStorage.getItem("generalSettings");
  if (storedGeneralSettings) {
    generalSettings.set(JSON.parse(storedGeneralSettings));
  }
  generalSettings.subscribe((value) => {
    localStorage.setItem("generalSettings", JSON.stringify(value));
  });

  const storedSettings = localStorage.getItem("settings");
  if (storedSettings) {
    settings.set(JSON.parse(storedSettings));
  }
  settings.subscribe((value) => {
    localStorage.setItem("settings", JSON.stringify(value));
  });
}
