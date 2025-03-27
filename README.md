# Gemini Nano AI Tools (alpha)

A Chrome extension to chat with the Nano AI Api built into Chrome.

## Features

- 💬 AI Chat
- 📃 AI Summarization
- 🖊️ AI Writing/Rewriting
- 🗺️ Language detect
- 🔒 No data shared, all models runs locally
- 🌐 Works anywhere in Chrome
- ⭕ Works Offilne

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory

### Models Enabling

Go to [Chrome flags](`chrome://flags`) and enable the following flags:

- [Opimization on device model](chrome://flags/#optimization-guide-on-device-model) - runs model on local hardware
- [LanguageModel model](chrome://flags/#prompt-api-for-gemini-nano-multimodal-input)
- [Summarizer model](chrome://flags/#summarization-api-for-gemini-nano)
- [Translator model](chrome://flags/#translation-api)
- [Language Detector model](chrome://flags/#language-detection-api)
- [Writer model](chrome://flags/#writer-api-for-gemini-nano)
- [Rewriter model](chrome://flags/#rewriter-api-for-gemini-nano)