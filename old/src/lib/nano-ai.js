class NanoAIService {
    constructor(serviceType) {
        if ('ai' in window && serviceType in window.ai) {
            this.serviceType = serviceType;
            this.options = {};
            this.controller = new AbortController();
        } else {
            throw new Error(`The ${serviceType} API is not available.`);
        }
    }
    
    async init(options = this.options) {
        const available = (await window.ai[this.serviceType].capabilities()).available;
        if (available === 'no') {
            throw new Error(`The ${this.serviceType} API is not available.`);
        }
        
        this.service = await window.ai[this.serviceType].create(options);
        
        if (available !== 'readily') {
            this.service.addEventListener('downloadprogress', (e) => {
                console.log(e.loaded, e.total);
            });
            await this.service.ready;
        }
        
        return this.service;
    }

    async reInit(){
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

    async prompt(message) {
        return await this.service.prompt(message, { signal: this.controller.signal });
    }

    promptStreaming(message){
        return this.service.promptStreaming(message, { signal: this.controller.signal });
    }  

    getTokensStatus() {
        return {
            used: this.service.tokensSoFar,
            left: this.service.tokensLeft,
            max: this.service.maxTokens
        }
    }

    setTemperature(value) {
        this.temperature = value;
        this.reInit();
    }
    setTopK(value) {
        this.topK = value;
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

    async summarize(text, context = '') {
        return await this.service.summarize(text, { context: context });
    }

    summarizeStreaming(text, context = '') {
        return this.service.summarizeStreaming(text, { context: context });
    }

    setSharedContext(sharedContext) {
        this.options.sharedContext = sharedContext;
        this.reInit();
    }
    setType(type) {
        this.options.type = type;
        this.reInit();
    }
    setFormat(format) {
        this.options.format = format;
        this.reInit();
    }
    setLength(length) {
        this.options.length = length;
        this.reInit();
    }
    
}

export class NanoAILanguageDetector extends NanoAIService {
    constructor() {
        super('languageDetector');
    }

    async detect(text) {
        return await this.service.detect(text);
    }
}

export class NanoAITranslator extends NanoAIService {
    constructor(options) {
        super('translator', options);
    }

    getSupportedLanguages() {
        return this.service.languages;
    }

    async translate(text, targetLanguage = 'en') {
        return await this.service.translate(text, targetLanguage);
    }
}

export class NanoAIWriter extends NanoAIService {
    constructor(options) {
        super('writer', options);
    }

    async write(text, context = '') {
        return await this.service.write(text, { context: context });
    }
}

export class NanoAIRewriter extends NanoAIService {
    constructor(options) {
        super('rewriter', options);
    }

    async rewrite(text, context = '') {
        return await this.service.rewrite(text, { context: context });
    }
}
