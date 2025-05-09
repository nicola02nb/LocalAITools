/**
 * This file defines classes that serve as a wrapper for the Nano AI API, 
 * providing functionalities for interacting with various AI services. 
 * These include language models, summarizers, language detectors, translators, writers, and rewriters.
 * Each class extends a base `NanoAIService` class, which handles initialization, options management, and error handling.
 * The services are designed to work with the `window.ai` object, which is expected to be provided by the environment.
 */
class NanoAIService {
    serviceType: string;
    options: any;
    controller: AbortController;
    service: any;
    constructor(serviceType: string) {
        if ('ai' in window && serviceType in window.ai) {
            this.serviceType = serviceType;
            this.options = {};
            this.controller = new AbortController();
        } else {
            throw new Error(`The ${serviceType} API is not available.`);
        }
    }
    
    async init(options = this.options) {
        let available = 'no';
        if (window.ai[this.serviceType].capabilities) {
            available = (await window.ai[this.serviceType].capabilities()).available;
        } else if (window.ai[this.serviceType].availability) {
            available = await window.ai[this.serviceType].availability();
        }
        if (available === 'no' || available === 'unavailable') {
            throw new Error(`The ${this.serviceType} API is not available.`);
        }
        
        this.service = await window.ai[this.serviceType].create(options);
        
        if (available !== 'readily' && available !== 'available') {
            this.service.addEventListener('downloadprogress', (e) => {
                console.log(e.loaded, e.total);
            });
            await this.service.ready;
        }
        
        return this.service;
    }

    async reInit(options: any = {}) {
        this.options = options || this.options;
        await this.init(this.options);
    }

    abort(){
        if (this.controller) {
            this.controller.abort();
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

export class NanoAILanguageModel extends NanoAIService {
    constructor() {
        super('languageModel');
        this.options.topK = 3;
        this.options.temperature = 1.0;
    }

    getSupportedOptions() {
        return {
            initialPrompts: [{}],
            maxTopK: 8,
            maxTemperature: 2.0,
        };
    }

    async prompt(message: string) {
        return await this.service.prompt(message, { signal: this.controller.signal });
    }

    promptStreaming(message: string) {
        return this.service.promptStreaming(message, { signal: this.controller.signal });
    }  

    getTokensStatus() {
        return {
            used: this.service.tokensSoFar,
            left: this.service.tokensLeft,
            max: this.service.maxTokens
        }
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

export class NanoAISummarizer extends NanoAIService {  
    constructor() {
        super('summarizer');
        this.options.sharedContext = '';
        this.options.type = 'key-points';
        this.options.format = 'plain-text';
        this.options.length = 'short';
    }
    
    getSupportedOptions() {
        return {
            sharedContext: [''],
            type: ['key-points', 'tl;dr', 'teaser', 'headline'],
            format: ['markdown', 'plain-text'],
            length: ['short', 'medium', 'long']
        };
    }

    async summarize(text: string, parameters = { context: '' }) {
        return await this.service.summarize(text/* , parameters */);
    }

    summarizeStreaming(text: string, parameters = { context: '' }) {
        return this.service.summarizeStreaming(text/* , parameters */);
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

export class NanoAILanguageDetector extends NanoAIService {
    constructor() {
        super('languageDetector');
    }

    async detect(text: string) {
        return await this.service.detect(text);
    }
}

export class NanoAITranslator extends NanoAIService {
    constructor( options: any = { }) {
        super('translator');
    }

    getSupportedLanguages() {
        return this.service.languages;
    }

    async translate(text: string) {
        return await this.service.translate(text);
    }

    translateStreaming(text: string) {
        return this.service.translateStreaming(text);
    }
}

export class NanoAIWriter extends NanoAIService {
    constructor() {
        super('writer');
        this.options.tone = "formal";
        this.options.length = "long";
    }

    async write(text: string) {
        return await this.service.write(text);
    }

    writeStreaming(text: string) {
        return this.service.writeStreaming(text);
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

export class NanoAIRewriter extends NanoAIService {
    constructor() {
        super('rewriter');
        this.options.sharedContext = '';
    }

    async rewrite(text: string) {
        return await this.service.rewrite(text);
    }

    rewriteStreaming(text: string) {
        return this.service.rewriteStreaming(text);
    }

    setSharedContext(sharedContext: string) {
        this.options.sharedContext = sharedContext;
        this.reInit();
    }
}
