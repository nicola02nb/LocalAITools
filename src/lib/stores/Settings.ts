import { writable } from "svelte/store";

interface GlobalSettings {
  sharedSidepanel: boolean;
  streamOutput: boolean;
  delayForStream: number;
  promptMultimodal: boolean;
  overlayEnabled: boolean;
  overlayHideOnClick: boolean;
}

const defaultGeneralSettings = {
  sharedSidepanel: true,
  streamOutput: true,
  delayForStream: 25,
  promptMultimodal: false,
  overlayEnabled: true,
  overlayHideOnClick: true,
};

export const generalSettings = writable<GlobalSettings>(defaultGeneralSettings);

export function resetSettings() {
  generalSettings.set(defaultGeneralSettings);
}

if (chrome?.storage?.local) {
  chrome.storage.local.get("generalSettings").then((result) => {
    if (result.generalSettings) {
      generalSettings.set(result.generalSettings);
    }
  });

  generalSettings.subscribe((value) => {
    chrome.storage.local.set({ generalSettings: value });
  });
} else if (self.localStorage) {
  const storedGeneralSettings = localStorage.getItem("generalSettings");
  if (storedGeneralSettings) {
    generalSettings.set(JSON.parse(storedGeneralSettings));
  }
  generalSettings.subscribe((value) => {
    localStorage.setItem("generalSettings", JSON.stringify(value));
  });
}
