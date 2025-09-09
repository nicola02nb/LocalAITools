import {
  isValidAction,
  type Action,
  type MessageObject,
} from "./lib/stores/Actions";

let isSidePanelEnabled = false;
let sharedSidepanel = true;
chrome.storage.local.get("generalSettings", (data) => {
  sharedSidepanel =
    data.generalSettings !== undefined
      ? data.generalSettings.sharedSidepanel
      : true;
});
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.generalSettings) {
    sharedSidepanel = changes.generalSettings.newValue.sharedSidepanel;
  }
});

// Pinned extension icon click handler
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Context menu creation
const menuItems: { id: Action; title: string }[] = [
  { id: "detector", title: "Language Detector" },
  { id: "translator", title: "Translate" },
  { id: "summarizer", title: "Summarize" },
  { id: "rewriter", title: "Rewrite" },
  { id: "proofreader", title: "Proofread" },
];
chrome.runtime.onInstalled.addListener(() => {
  menuItems.forEach(({ id, title }) => {
    chrome.contextMenus.create({
      id: id,
      title: title,
      contexts: ["selection"],
    });
  });
});

function setSidepanelVisible(
  visible: boolean,
  tab: chrome.tabs.Tab,
  callback = () => {},
) {
  isSidePanelEnabled = visible;
  chrome.sidePanel.setOptions({ enabled: visible }, () => {
    if (visible) {
      if (sharedSidepanel) {
        chrome.sidePanel.open({ windowId: tab.windowId }, callback);
      } else {
        if (tab.id) {
          chrome.sidePanel.open({ tabId: tab.id }, callback);
        }
      }
    }
  });
}

function sendMessage(message: MessageObject) {
  chrome.runtime.sendMessage(message, function (response) {
    if (!response) {
      setTimeout(() => {
        sendMessage(message);
      }, 500);
    }
  });
}

// Shortcut open side panel
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle_side_panel") {
    isSidePanelEnabled = !isSidePanelEnabled;
    setSidepanelVisible(isSidePanelEnabled, tab);
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId in menuItems.map((item) => item.id) && tab) {
    setSidepanelVisible(true, tab, () => {
      if (
        info.selectionText &&
        typeof info.menuItemId === "string" &&
        isValidAction(info.menuItemId)
      ) {
        sendMessage({ action: info.menuItemId, text: info.selectionText });
      }
    });
  }
});

// Overlay click handler
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg: MessageObject) => {
    if (port?.sender?.tab) {
      setSidepanelVisible(true, port.sender.tab, () => {
        sendMessage({ action: msg.action, text: msg.text });
      });
    }
  });
});
