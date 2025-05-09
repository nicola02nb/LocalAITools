import { writable,  } from 'svelte/store';

export let activeTab = writable<string>('home');

export let generalSettings = writable<{ [key: string]: any }>({
    streamOutput: true,
    delayForStream: 25,
});
export let settings = writable<{ [key: string]: any }>({});
export let inputs = writable<{ [key: string]: any }>({});

if (chrome?.storage?.local) {
    chrome.storage.local.get('activeTab').then((result) => {
        if (result.activeTab) {
            activeTab.set(result.activeTab);
        }
    });
    activeTab.subscribe((value) => {
        chrome.storage.local.set({ activeTab: value });
    });
    
    chrome.storage.local.get('generalSettings').then((result) => {
        if (result.generalSettings) {
            generalSettings.set(result.generalSettings);
        }
    });
    generalSettings.subscribe((value) => {
        chrome.storage.local.set({ generalSettings: value });
    });

    chrome.storage.local.get('settings').then((result) => {
        if (result.settings) {
            settings.set(result.settings);
        }
    });
    settings.subscribe((value) => {
        chrome.storage.local.set({ settings: value });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        let action: string = request.action;
        activeTab.set(action);
        inputs.set({ ...inputs, [action]: { [action+"-text"]: request.text} });
        sendResponse({ status: "success"});
    });
}