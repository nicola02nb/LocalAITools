const actions = ["summarizer", "detector", "translator", "rewriter"];
const mapActions = {
  summarizer: {
    text: "Summarize",
    className: "Summarizer",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="black"><path d="M320-600q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm0 160q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0 160q17 0 28.5-11.5T360-320q0-17-11.5-28.5T320-360q-17 0-28.5 11.5T280-320q0 17 11.5 28.5T320-280ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h440l200 200v440q0 33-23.5 56.5T760-120H200Zm0-80h560v-400H600v-160H200v560Zm0-560v160-160 560-560Z"/></svg>',
  },
  translator: {
    text: "Translate",
    className: "Translator",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="black"><path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z"/></svg>',
  },
  detector: {
    text: "Detect",
    className: "LanguageDetector",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="black"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>',
  },
  rewriter: {
    text: "Rewrite",
    className: "Rewriter",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="black"><path d="m490-527 37 37 217-217-37-37-217 217ZM200-200h37l233-233-37-37-233 233v37Zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678L555-405ZM270-120H120v-150l285-285 150 150-285 285Z"/></svg>',
  },
};

class Overlay {
  isEnabled;
  hideOnClick;

  overlay;
  buttons;

  shown;

  hideTimeout;

  constructor({ isEnabled = true, hideOnClick = true } = {}) {
    this.isEnabled = isEnabled;
    this.hideOnClick = hideOnClick;
    this.overlay = document.createElement("div");
    this.overlay.id = "nano-ai-extension-overlay";
    this.overlay.classList.add("hidden");
    this.buttons = [];
    this.shown = false;
    this.hideTimeout = null;
    for (let action of actions) {
      const button = this.createActionButton(action);
      this.buttons.push(button);
      this.overlay.appendChild(button);
    }
    document.body.appendChild(this.overlay);
  }

  createActionButton(action) {
    let button = document.createElement("button");
    button.innerHTML = mapActions[action]["icon"];
    button.classList.add("nano-ai-extension-button");
    button.setAttribute("action", action);
    button.title = mapActions[action]["text"];
    button.onclick = () => {
      let selection = document.getSelection();
      if (!this.overlay.classList.contains("disabled")) {
        const port = chrome.runtime.connect();
        port.postMessage({ action: action, text: selection.toString() });
      }
      this.hide();
    };
    return button;
  }
  updateButtons() {
    for (const button of this.buttons) {
      const action = button.getAttribute("action");
      if (!self[mapActions[action].className]) {
        button.classList.add("disabled");
      } else {
        button.classList.remove("disabled");
      }
    }
  }

  setEnabled(enabled) {
    if (enabled) {
      this.isEnabled = true;
    } else {
      this.isEnabled = false;
      this.hide();
    }
  }
  setHideOnClick(hideOnClick) {
    if (hideOnClick) {
      this.hideOnClick = true;
      this.overlay.onclick = () => {
        this.hide();
      };
    } else {
      this.hideOnClick = false;
      this.overlay.onclick = null;
    }
  }

  show(x, y) {
    if (!this.isEnabled) return;

    this.updateButtons();

    if (!this.shown) {
      this.overlay.classList.remove("hidden");
    }

    this.move(x, y);

    this.shown = true;
    this.startTimeoutHide(5000);
  }
  hide() {
    this.shown = false;
    this.overlay.classList.add("hidden");
    this.stopTimeoutHide();
  }
  move(x, y) {
    this.overlay.style.left = `${x}px`;
    this.overlay.style.top = `${y}px`;
  }

  startTimeoutHide(timeout) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, timeout);
  }
  stopTimeoutHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

const overlay = new Overlay();

document.addEventListener("selectionchange", function () {
  let selection = document.getSelection();
  if (!selection.isCollapsed) {
    let range = selection.getRangeAt(selection.rangeCount - 1);
    let startRange = range.cloneRange();
    startRange.collapse(true);
    let endRange = range.cloneRange();
    endRange.collapse(false);
    let startRect = startRange.getBoundingClientRect();
    let endRect = endRange.getBoundingClientRect();
    let isReverse = startRect.left > endRect.left;
    let rect = isReverse ? startRect : endRect;
    overlay.show(rect.right + window.scrollX, rect.bottom + window.scrollY);
  } else {
    overlay.hide();
  }
});

chrome.storage.local.get("generalSettings").then((result) => {
  if (result.generalSettings) {
    const settings = result.generalSettings;
    overlay.setEnabled(settings.overlayEnabled);
    overlay.setHideOnClick(settings.hideOnClick);
  }
});

chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.generalSettings) {
    const settings = changes.generalSettings.newValue;
    if (settings) {
      overlay.setEnabled(settings.overlayEnabled);
      overlay.setHideOnClick(settings.overlayHideOnClick);
    }
  }
});
