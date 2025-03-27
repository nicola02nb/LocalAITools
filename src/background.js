var isSidePanelEnabled = false;
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle_side_panel") {
    isSidePanelEnabled = !isSidePanelEnabled;
    chrome.sidePanel.setOptions({ enabled: isSidePanelEnabled });
    if (isSidePanelEnabled) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lm" || info.menuItemId === "summarizer" 
    || info.menuItemId === "translate" || info.menuItemId === "detector") {
    let data = {};
    data[info.menuItemId] = null;
    chrome.storage.local.set(data, () => {
      chrome.sidePanel.setOptions({ enabled: true });
      chrome.sidePanel.open({ windowId: tab.windowId });
    });
    data[info.menuItemId] = info.selectionText;
    chrome.storage.local.set(data);
  }
});

chrome.contextMenus.create({
  id: "lm",
  title: "Language Model",
  contexts:["selection"]
});

chrome.contextMenus.create({
  id: "summarizer",
  title: "Summarize",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "translate",
  title: "Translate",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "detector",
  title: "Language Detector",
  contexts: ["selection"]
});