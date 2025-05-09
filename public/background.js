var isSidePanelEnabled = false;

function setSidepanelVisible(visible, windowId, callback = () => {}) {
  isSidePanelEnabled = visible;
  chrome.sidePanel.setOptions({ enabled: visible });
  if (visible) {
    chrome.sidePanel.open({ windowId: windowId }, callback);
  }
}

function sendMessage(message){
  chrome.runtime.sendMessage(message, function(response) {
    if(!response) {
      setTimeout(() => {
        sendMessage(message);
      }, 500);
    }
  });
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle_side_panel") {
    isSidePanelEnabled = !isSidePanelEnabled;
    setSidepanelVisible(isSidePanelEnabled, tab.windowId);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarizer" || info.menuItemId === "detector" 
    || info.menuItemId === "translate" || info.menuItemId === "rewriter") {
    setSidepanelVisible(true, tab.windowId, () => {
      sendMessage({ action: info.menuItemId, text: info.selectionText });
    });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    setSidepanelVisible(true, port.sender.tab.windowId, () => {;
      sendMessage({ action: msg.action, text: msg.text });
    });
  });
});

const menuItems = [
  { id: "summarizer", title: "Summarize" },
  { id: "detector", title: "Language Detector" },
  { id: "translate", title: "Translate" },
  { id: "rewriter", title: "Rewrite" },
];

menuItems.forEach(({ id, title }) => {
  chrome.contextMenus.create({
    id: id,
    title: title,
    contexts: ["selection"],
  });
});
