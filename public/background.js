var isSidePanelEnabled = false;
var sharedSidepanel = true;
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
const menuItems = [
  { id: "summarizer", title: "Summarize" },
  { id: "detector", title: "Language Detector" },
  { id: "translate", title: "Translate" },
  { id: "rewriter", title: "Rewrite" },
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

function setSidepanelVisible(visible, tab, callback = () => {}) {
  isSidePanelEnabled = visible;
  chrome.sidePanel.setOptions({ enabled: visible }, () => {
    if (visible) {
      if (sharedSidepanel) {
        chrome.sidePanel.open({ windowId: tab.windowId }, callback);
      } else {
        chrome.sidePanel.open({ tabId: tab.id }, callback);
      }
    }
  });
}

function sendMessage(message) {
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
  if (
    info.menuItemId === "summarizer" ||
    info.menuItemId === "detector" ||
    info.menuItemId === "translator" ||
    info.menuItemId === "rewriter"
  ) {
    setSidepanelVisible(true, tab, () => {
      sendMessage({ action: info.menuItemId, text: info.selectionText });
    });
  }
});

// Overlay click handler
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    setSidepanelVisible(true, port.sender.tab, () => {
      sendMessage({ action: msg.action, text: msg.text });
    });
  });
});
