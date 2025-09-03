import { writable } from "svelte/store";
import type { ModelInput, ModelOutput } from "../api/nano-ai";
import type { AiTab, TabName } from "./ActiveTab";

type InputType = { [key: string]: string };
type Input = {
  [K in AiTab]: InputType;
}
type SettingsType = { [key: string]: boolean | number | string | string[] };
type Settings = {
  [key in AiTab]: SettingsType;
}
export type MessagesTypes = (ModelInput | ModelOutput)[];

export const inputs = writable<Input>({
  prompt: {},
  summarizer: {},
  detector: {},
  translator: {},
  writer: {},
  rewriter: {},
  proofreader: {}
});
export const settings = writable<Settings>({
  prompt: {},
  summarizer: {},
  detector: {},
  translator: {},
  writer: {},
  rewriter: {},
  proofreader: {}
});
export const messages = writable<{ [key in TabName]: ModelOutput[] }>({
  home: new Array<ModelOutput>(),
  prompt: new Array<ModelOutput>(),
  summarizer: new Array<ModelOutput>(),
  detector: new Array<ModelOutput>(),
  translator: new Array<ModelOutput>(),
  writer: new Array<ModelOutput>(),
  rewriter: new Array<ModelOutput>(),
  proofreader: new Array<ModelOutput>(),
  settings: new Array<ModelOutput>(),
});

if (chrome?.storage?.local) {
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
      const action: AiTab = request.action;
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
  const storedSettings = localStorage.getItem("settings");
  if (storedSettings) {
    settings.set(JSON.parse(storedSettings));
  }
  settings.subscribe((value) => {
    localStorage.setItem("settings", JSON.stringify(value));
  });
}