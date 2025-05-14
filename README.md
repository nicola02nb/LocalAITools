# Gemini Nano AI Tools (alpha)

A Chrome extension to interact with the Nano AI API built into Chrome.

## Features

- 💬 AI Chat - Converse with an on-device AI assistant
- 📃 AI Summarization - Get concise summaries of content
- 🗺️ AI Translation - Translate text between languages
- 🔎 AI Language Detection - Identify the language of text
- 🖊️ AI Writing/Rewriting - Generate and improve content
- 🔒 Privacy Focused - All processing happens locally on your device
- 🌐 Universal Access - Works anywhere in Chrome
- ⭕ Offline Capability - No internet connection required

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory

### Enabling Required Models

Navigate to Chrome flags (`chrome://flags`) and enable:

- [Optimization on-device model](chrome://flags/#optimization-guide-on-device-model)
- [LanguageModel API](chrome://flags/#prompt-api-for-gemini-nano-multimodal-input)
- [Summarizer API](chrome://flags/#summarization-api-for-gemini-nano)
- [Translator API](chrome://flags/#translation-api) ([Bypass language restrictions](https://developer.chrome.com/docs/ai/translator-api#bypass_language_restrictions_for_local_testing))
- [Language Detection API](chrome://flags/#language-detection-api)
- [Writer API](chrome://flags/#writer-api-for-gemini-nano)
- [Rewriter API](chrome://flags/#rewriter-api-for-gemini-nano)

## Disclaimer

This extension leverages Chrome's experimental Nano AI [APIs](https://developer.chrome.com/docs/ai/built-in) which are still under active development. Please be aware that these APIs may:

- Change without prior notice
- Exhibit inconsistent behavior
- Provide limited functionality compared to cloud AI models
- Potentially impact browser performance

## Unofficial API reference

- [Prompt API]() (Under development)
- [Translation API](https://webmachinelearning.github.io/translation-api/)
- [Writing Assistance API](https://webmachinelearning.github.io/writing-assistance-apis/)

We cannot guarantee consistent operation across all Chrome versions or platforms. Use at your own discretion and please report any issues.

## Contribution

Contributions are welcome! Feel free to submit pull requests or open issues to improve the extension.
