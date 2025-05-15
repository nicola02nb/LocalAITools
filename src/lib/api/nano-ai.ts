/*
 * This file defines classes that serve as a wrapper for the Nano AI API,
 * providing functionalities for interacting with various AI services.
 * These include language models, summarizers, language detectors, translators, writers, and rewriters.
 * Each class extends a base `NanoAIService` class, which handles initialization, options management, and error handling.
 * The services are designed to work with the `window.ai` object, which is expected to be provided by the environment.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Prompt {
  role: string;
  content: string;
}

interface NanoAIServiceOptions {
  [key: string]: Prompt[] | string | number | boolean | undefined;
}

interface NanoAIService {
  [key: string]: any;
}

export class NanoAIBase {
  serviceType: string;
  exists: boolean;
  options: NanoAIServiceOptions;

  controller!: AbortController;
  service: NanoAIService | undefined;

  call?: (
    ...args: string[]
  ) => Promise<string | { detectedLanguage: string; confidence: number }[]>;
  callStream?: (...args: string[]) => ReadableStream<Promise<string>>;

  callBackDownload: (e: { loaded: number }) => void = () => {};

  constructor(serviceType: string, options: NanoAIServiceOptions = {}) {
    this.serviceType = serviceType;
    this.exists = false;
    this.options = options;
    this.controller = new AbortController();
    if (serviceType in self) {
      this.exists = true;
    } else {
      console.error(`The ${serviceType} API is not available.`);
    }
  }

  async init(
    options = this.options,
    callbackDownload: (e: { loaded: number }) => void,
  ) {
    this.callBackDownload = callbackDownload;
    let availability;
    if (!this.exists) return;
    if (this.serviceType === "Translator")
      availability = (self as any)[this.serviceType].availability(options);
    else availability = (self as any)[this.serviceType].availability();

    if (availability === "unavailable") return;

    if (availability === "available") {
      this.service = await (self as any)[this.serviceType].create({
        ...options,
      });
    } else {
      this.service = await (self as any)[this.serviceType].create({
        ...options,
        monitor(m: {
          addEventListener: (
            event: string,
            callback: (e: { loaded: number }) => void,
          ) => void;
        }) {
          m.addEventListener("downloadprogress", callbackDownload);
        },
      });
      await this.service?.ready;
    }
  }

  async reInit(options: NanoAIServiceOptions = this.options) {
    this.destroy();
    this.options = options || this.options;
    await this.init(this.options, this.callBackDownload);
  }

  abort(message: string = "Aborted") {
    if (this.controller) {
      this.controller.abort(message);
      this.controller = new AbortController();
    }
  }

  destroy() {
    this.abort();
    if (this.service) {
      this.service.destroy();
    }
  }
}

export class NanoAILanguageModel extends NanoAIBase {
  constructor(
    options: NanoAIServiceOptions = {
      topK: 3,
      temperature: 1.0,
    },
  ) {
    super("LanguageModel", options);
    this.call = this.prompt;
    this.callStream = this.promptStreaming;
  }

  getSupportedOptions() {
    return {
      initialPrompts: [{}],
      maxTopK: 8,
      maxTemperature: 2.0,
    };
  }

  async prompt(message: string) {
    return await this.service?.prompt(message, {
      signal: this.controller.signal,
    });
  }

  promptStreaming(message: string) {
    return this.service?.promptStreaming(message, {
      signal: this.controller.signal,
    });
  }

  measureInputUsage(text: string) {
    return this.service?.measureInputUsage(text);
  }

  getTokensStatus() {
    return {
      used: this.service?.inputUsage,
      left: this.service?.inputQuota - this.service?.inputUsage,
      max: this.service?.inputQuota,
    };
  }

  setOnQuotaOverflow(
    callback: (status: { used: number; left: number; max: number }) => void,
  ) {
    if (!this.service) {
      console.error("Service is not initialized.");
      return;
    }
    this.service.onQuotaOverflow = callback;
  }

  setTemperature(value: number) {
    this.options.temperature = value;
    this.reInit();
  }
  setTopK(value: number) {
    this.options.topK = value;
    this.reInit();
  }
}

export class NanoAISummarizer extends NanoAIBase {
  constructor(
    options: NanoAIServiceOptions = {
      sharedContext: "",
      type: "key-points",
      format: "plain-text",
      length: "short",
    },
  ) {
    super("Summarizer", options);
    this.call = this.summarize;
    this.callStream = this.summarizeStreaming;
  }

  getSupportedOptions() {
    return {
      sharedContext: [""],
      type: ["key-points", "tl;dr", "teaser", "headline"],
      format: ["markdown", "plain-text"],
      length: ["short", "medium", "long"],
    };
  }

  async summarize(text: string, context: string = "") {
    return await this.service?.summarize(text, { context });
  }

  summarizeStreaming(text: string, context: string = "") {
    return this.service?.summarizeStreaming(text, { context });
  }

  setSharedContext(sharedContext: string) {
    this.options.sharedContext = sharedContext;
    this.reInit();
  }
  setType(type: string) {
    this.options.type = type;
    this.reInit();
  }
  setFormat(format: string) {
    this.options.format = format;
    this.reInit();
  }
  setLength(length: string) {
    this.options.length = length;
    this.reInit();
  }
}

export class NanoAILanguageDetector extends NanoAIBase {
  constructor() {
    super("LanguageDetector");
    this.call = this.detect;
  }

  async detect(text: string) {
    return await this.service?.detect(text);
  }
}

export class NanoAITranslator extends NanoAIBase {
  constructor(
    options: NanoAIServiceOptions = {
      sourceLanguage: "en",
      targetLanguage: "en",
    },
  ) {
    super("Translator", options);
    this.call = this.translate;
    this.callStream = this.translateStreaming;
  }

  getSupportedLanguages() {
    return this.service?.languages;
  }

  areLanguagesChanged(sourceLanguage: string, targetLanguage: string): boolean {
    return (
      this.service?.sourceLanguage !== sourceLanguage ||
      this.service?.targetLanguage !== targetLanguage
    );
  }

  async translate(text: string) {
    return await this.service?.translate(text);
  }

  translateStreaming(text: string) {
    return this.service?.translateStreaming(text);
  }
}

export class NanoAIWriter extends NanoAIBase {
  constructor(
    options: NanoAIServiceOptions = { tone: "formal", length: "long" },
  ) {
    super("Writer", options);
    this.call = this.write;
    this.callStream = this.writeStreaming;
  }

  async write(text: string) {
    return await this.service?.write(text);
  }

  writeStreaming(text: string) {
    return this.service?.writeStreaming(text);
  }

  setTone(tone: string) {
    this.options.tone = tone;
    this.reInit();
  }
  setLength(length: string) {
    this.options.length = length;
    this.reInit();
  }
}

export class NanoAIRewriter extends NanoAIBase {
  constructor(options: NanoAIServiceOptions = { sharedContext: "" }) {
    super("Rewriter", options);
    this.call = this.rewrite;
    this.callStream = this.rewriteStreaming;
  }

  async rewrite(text: string) {
    return await this.service?.rewrite(text);
  }

  rewriteStreaming(text: string) {
    return this.service?.rewriteStreaming(text);
  }

  setSharedContext(sharedContext: string) {
    this.options.sharedContext = sharedContext;
    this.reInit();
  }
}

export const mapNameToClass: { [key: string]: NanoAIBase } = {
  LanguageModel: new NanoAILanguageModel(),
  Summarizer: new NanoAISummarizer(),
  LanguageDetector: new NanoAILanguageDetector(),
  Translator: new NanoAITranslator(),
  Writer: new NanoAIWriter(),
  Rewriter: new NanoAIRewriter(),
};
