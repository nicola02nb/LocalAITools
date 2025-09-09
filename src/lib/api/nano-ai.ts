/*
 * This file defines classes that serve as a wrapper for the Nano AI API,
 * providing functionalities for interacting with various AI services.
 * These include language models, summarizers, language detectors, translators, writers, and rewriters.
 * Each class extends a base `NanoAIService` class, which handles initialization, options management, and error handling.
 * The services are designed to work with the `window.ai` object, which is expected to be provided by the environment.
 */
interface Model {
  availability(options?: CreateOptions): Promise<Availability>;
  create(options?: CreateOptions): Promise<Service>;
}
type Service =
  | (LanguageModel & Model)
  | (Summarizer & Model)
  | (LanguageDetector & Model)
  | (Translator & Model)
  | (Writer & Model)
  | (Rewriter & Model)
  | (Proofreader & Model);
type CreateOptions =
  | LanguageModelCreateOptions
  | SummarizerCreateOptions
  | TranslatorCreateOptions
  | WriterCreateOptions
  | RewriterCreateOptions
  | ProofreaderCreateOptions;
type CallOptions =
  | LanguageModelPromptOptions
  | SummarizerSummarizeOptions
  | TranslatorTranslateOptions
  | WriterWriteOptions
  | RewriterRewriteOptions
  | ProofreaderProofreadOptions;
export type ModelInput = string | LanguageModelPrompt;
export type ModelOutput =
  | string
  | LanguageModelMessage
  | LanguageDetectionResult[]
  | ProofreaderProofreadResult;

type CallbackDownload = (ev: ProgressEvent<EventTarget>) => void;

const serviceNotAvailable = "Ai service is not available";
export class ApiBase<
  S extends Service,
  C extends CreateOptions,
  CO extends CallOptions,
  I extends ModelInput,
  O extends ModelOutput,
> {
  exists: boolean;
  options: C;

  serviceName: string = "";
  serviceClass: S;
  serviceInstance?: S;

  call?: (message: I, options?: CO) => Promise<O>;
  callStream?: (message: I, options?: CO) => ReadableStream<O>;
  controller?: AbortController;

  monitor?: CreateMonitorCallback;
  callBackDownload?: CallbackDownload;

  constructor(serviceType: string, options: C) {
    this.serviceName = serviceType;
    this.options = options;
    this.serviceClass = (self as never)[serviceType];
    this.controller = new AbortController();
    this.exists = this.serviceClass !== undefined;
    this.serviceInstance = this.serviceClass;
  }

  setCallBackDownload(callback?: CallbackDownload) {
    if (!callback) return;
    this.callBackDownload = callback;
    this.monitor = (monitor: CreateMonitor) => {
      if (this.callBackDownload) {
        monitor.addEventListener("downloadprogress", this.callBackDownload, {
          once: false,
          passive: true,
          signal: this.controller?.signal,
        });
      }
    };
  }

  async availability(options = this.options) {
    if (!this.exists || !this.serviceName || !this.serviceClass || !this)
      return "unavailable";
    if (this.serviceName === "Translator" || this.serviceName === "Proofreader")
      return await this.serviceClass.availability(options);
    else return await this.serviceClass.availability();
  }

  async init(callBackDownload?: CallbackDownload) {
    this.setCallBackDownload(callBackDownload);
    if (!this.exists || !this.serviceName || !this.serviceClass) return;

    const availability = await this.availability();

    if (availability === "unavailable") return;

    if (availability === "available") {
      this.serviceInstance = (await this.serviceClass.create({
        ...this.options,
        signal: this.controller?.signal,
      })) as S;
    } else {
      this.serviceInstance = (await this.serviceClass.create({
        ...this.options,
        signal: this.controller?.signal,
        monitor: this.monitor,
      })) as S;
    }
  }

  async reInit(options: C = this.options, callbackDownload?: CallbackDownload) {
    this.destroy();
    this.options = options || this.options;
    this.callBackDownload = callbackDownload || this.callBackDownload;
    await this.init(this.callBackDownload);
  }

  async measureInputUsage(text: string, options?: CallOptions) {
    if (this.serviceInstance && "measureInputUsage" in this.serviceInstance) {
      return await this.serviceInstance.measureInputUsage(text, options);
    }
    return undefined;
  }

  abort(message: string = "Aborted") {
    this.controller?.abort(message);
    this.controller = new AbortController();
  }

  destroy() {
    this.abort();
    if (this.serviceInstance?.destroy) this.serviceInstance?.destroy();
  }
}

export class ApiPrompt extends ApiBase<
  LanguageModel & Model,
  LanguageModelCreateOptions,
  LanguageModelPromptOptions,
  LanguageModelPrompt,
  string
> {
  constructor(options?: CreateOptions) {
    super("LanguageModel", {
      ...(options as LanguageModelCreateOptions),
      expectedInputs: [{ type: "text" }, { type: "image" }],
    });
    this.call = this.prompt;
    this.callStream = this.promptStreaming;
  }

  async prompt(
    message: LanguageModelPrompt,
    options?: LanguageModelPromptOptions,
  ) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.prompt(message, {
      ...options,
      signal: this.controller?.signal,
    });
  }

  promptStreaming(
    message: LanguageModelPrompt,
    options?: LanguageModelPromptOptions,
  ) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return this.serviceInstance.promptStreaming(message, {
      ...options,
      signal: this.controller?.signal,
    });
  }

  getTokensStatus() {
    return {
      used: this.serviceInstance?.inputUsage ?? 0,
      left:
        (this.serviceInstance?.inputQuota ?? 0) -
        (this.serviceInstance?.inputUsage ?? 0),
      max: this.serviceInstance?.inputQuota ?? 0,
    };
  }

  onQuotaOverflow(callback: (this: LanguageModel, ev: Event) => void) {
    if (this.serviceInstance) {
      this.serviceInstance.onquotaoverflow = callback;
    }
  }

  clone() {
    this.serviceInstance?.clone();
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

export class ApiSummarizer extends ApiBase<
  Summarizer & Model,
  SummarizerCreateOptions,
  SummarizerSummarizeOptions,
  string,
  string
> {
  constructor(options?: CreateOptions) {
    super("Summarizer", options as SummarizerCreateOptions);
    this.call = this.summarize;
    this.callStream = this.summarizeStreaming;
  }

  async summarize(text: string, options?: SummarizerSummarizeOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.summarize(text, options);
  }

  summarizeStreaming(text: string, options?: SummarizerSummarizeOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return this.serviceInstance.summarizeStreaming(text, options);
  }

  setSharedContext(sharedContext: string) {
    this.options.sharedContext = sharedContext;
    this.reInit();
  }
  setType(type: SummarizerType) {
    this.options.type = type;
    this.reInit();
  }
  setFormat(format: SummarizerFormat) {
    this.options.format = format;
    this.reInit();
  }
  setLength(length: SummarizerLength) {
    this.options.length = length;
    this.reInit();
  }
}

export class ApiLanguageDetector extends ApiBase<
  LanguageDetector & Model,
  LanguageDetectorCreateOptions,
  LanguageDetectorDetectOptions,
  string,
  LanguageDetectionResult[] | string
> {
  constructor(options?: CreateOptions) {
    super("LanguageDetector", options as LanguageDetectorCreateOptions);
    this.call = this.detect;
  }

  async detect(text: string, options?: LanguageDetectorDetectOptions) {
    return (
      (await this.serviceInstance?.detect(text, options)) || serviceNotAvailable
    );
  }
}

export class ApiTranslator extends ApiBase<
  Translator & Model,
  TranslatorCreateOptions,
  TranslatorTranslateOptions,
  string,
  string
> {
  constructor(options: CreateOptions) {
    super("Translator", options as TranslatorCreateOptions);
    this.call = this.translate;
    this.callStream = this.translateStreaming;
  }

  static getSupportedLanguages() {
    return [];
  }

  areLanguagesChanged(sourceLanguage: string, targetLanguage: string) {
    return (
      this.serviceInstance?.sourceLanguage === undefined ||
      this.serviceInstance?.targetLanguage === undefined ||
      this.serviceInstance?.sourceLanguage !== sourceLanguage ||
      this.serviceInstance?.targetLanguage !== targetLanguage
    );
  }

  async translate(text: string) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.translate(text);
  }

  translateStreaming(text: string) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return this.serviceInstance.translateStreaming(text);
  }
}

export class ApiWriter extends ApiBase<
  Writer & Model,
  WriterCreateOptions,
  WriterWriteOptions,
  string,
  string
> {
  constructor(options?: CreateOptions) {
    super("Writer", options as WriterCreateOptions);
    this.call = this.write;
    this.callStream = this.writeStreaming;
  }

  async write(text: string, options?: WriterWriteOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.write(text, options);
  }

  writeStreaming(text: string, options?: WriterWriteOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return this.serviceInstance.writeStreaming(text, options);
  }

  setTone(tone: WriterTone) {
    this.options.tone = tone;
    this.reInit();
  }
  setLength(length: WriterLength) {
    this.options.length = length;
    this.reInit();
  }
}

export class ApiRewriter extends ApiBase<
  Rewriter & Model,
  RewriterCreateOptions,
  RewriterRewriteOptions,
  string,
  string
> {
  constructor(options?: CreateOptions) {
    super("Rewriter", options as RewriterCreateOptions);
    this.call = this.rewrite;
    this.callStream = this.rewriteStreaming;
  }

  async rewrite(text: string, options?: RewriterRewriteOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.rewrite(text, options);
  }

  rewriteStreaming(text: string, options?: RewriterRewriteOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return this.serviceInstance.rewriteStreaming(text, options);
  }
}

export class ApiProofreader extends ApiBase<
  Proofreader & Model,
  ProofreaderCreateOptions,
  ProofreaderProofreadOptions,
  string,
  ProofreaderProofreadResult
> {
  constructor(options?: CreateOptions) {
    super("Proofreader", options as ProofreaderCreateOptions);
    this.call = this.proofread;
  }

  areLanguagesChanged(
    expectedInputLanguages: string[],
    correctionExplanationLanguage: string,
  ) {
    return (
      this.serviceInstance?.expectedInputLanguages === undefined ||
      this.serviceInstance?.correctionExplanationLanguage === undefined ||
      this.serviceInstance?.expectedInputLanguages !== expectedInputLanguages ||
      this.serviceInstance?.correctionExplanationLanguage !==
        correctionExplanationLanguage
    );
  }

  async proofread(text: string, options?: ProofreaderProofreadOptions) {
    if (!this.serviceInstance) throw new Error(serviceNotAvailable);
    return await this.serviceInstance.proofread(text, options);
  }
}

export const mapNameToClass = {
  Prompt: ApiPrompt,
  Summarizer: ApiSummarizer,
  LanguageDetector: ApiLanguageDetector,
  Translator: ApiTranslator,
  Writer: ApiWriter,
  Rewriter: ApiRewriter,
  Proofreader: ApiProofreader,
};
