import { convertTextToHTML } from '../lib/llmToHtml.js';
import * as NanoAI from '../lib/nano-ai.js';

let BUTTONS;
let PANES;

const loader = document.createElement('div');
loader.className = 'loader';

function isAvailable(type) {
    const mapping = {
        'lm': 'languageModel',
        'summarizer': 'summarizer',
        'translate': 'translator',
        'detector': 'languageDetector',
        'writer': 'writer',
        'rewriter': 'rewriter'
    };
    return window?.ai?.[mapping[type]] || type === 'home';
}

function createButton(type){
    let button = document.createElement('button');
    button.className = 'tab-button';
    button.innerHTML = type.charAt(0).toUpperCase() + type.slice(1);
    button.setAttribute('data-tab', type);
    if (type === 'home') button.classList.add('active');
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const tabId = this.getAttribute('data-tab');
        activateTab(tabId);
    });
    return button;
}

function initializeButtons() {
    let buttonContainer = document.getElementById('tab-buttons');
    let types = ['home', 'lm', 'summarizer', 'translate', 'detector', 'writer', 'rewriter'];
    for (const type of types) {
        if (!isAvailable(type)) continue;
        let button = createButton(type);
        buttonContainer.appendChild(button);
    }
}

function activateTab(tabId) {
    for (const button of BUTTONS) {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
    for (const pane of PANES) {
        if (pane.getAttribute('id') === tabId) {
            pane.style.display = 'block';
        } else {
            pane.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
    BUTTONS = document.getElementsByClassName('tab-button');
    PANES = document.getElementsByClassName('tab-pane');

    let optionsButttons = document.getElementsByClassName('options-button');
    for (const button of optionsButttons) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const options = this.parentNode.getElementsByClassName('options')[0];
            options.classList.toggle('hidden');
        });
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if(newValue !== null) {
            document.getElementById(key+"-text").value = newValue;
            activateTab(key);
            let data = {};
            data[key] = undefined;
            chrome.storage.local.set(data);
            document.getElementById(key+"-form").dispatchEvent(new Event('submit'));
        }
    }
});

let LM = new NanoAI.NanoAILanguageModel();
let LM_MESSAGES;

function updateTokensStatus() {
    const tokensStatus = LM.getTokensStatus();
    const tokensUsed = document.getElementById('lm-tokens-used');
    const tokensMax = document.getElementById('lm-tokens-max');  
    
    tokensUsed.textContent = `Used: ${tokensStatus.used}`;
    tokensMax.textContent = `Max: ${tokensStatus.max}`;
}

document.addEventListener('DOMContentLoaded', function() {
    LM_MESSAGES = document.getElementById('lm-messages');

    document.getElementById('lm-temperature').addEventListener('change', function() {
        const temperatureValue = this.value;
        LM.setTemperature(temperatureValue);
        LM_MESSAGES.innerHTML = '';
    });
    document.getElementById('lm-topk').addEventListener('change', function() {
        const topkValue = this.value;
        LM.setTopK(topkValue);
        LM_MESSAGES.innerHTML = '';
    });
    
    document.getElementById('lm-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        let text = '';
        formData.forEach((value, key) => {
            if(key === 'text') {
                text = value;
            }
        });
        let userText = document.createElement('div');
        userText.textContent = text;
        userText.className = 'message user';
        LM_MESSAGES.appendChild(userText);
        let aiText = document.createElement('div');
        aiText.className = 'message ai';
        aiText.appendChild(loader);
        LM_MESSAGES.appendChild(aiText);    
        Promise.resolve(LM.prompt(text)).then((response) => {
            aiText.removeChild(loader);
            aiText.innerHTML = convertTextToHTML(response);
            updateTokensStatus();
        }
        ).catch((error) => {
            aiText.removeChild(loader);
            aiText.classList.remove('ai');
            aiText.classList.add('error');
            aiText.textContent = `Error: ${error.message}`;
        });
        document.getElementById('lm-text').value = '';
    });
});

let SUMMARIZER = new NanoAI.NanoAISummarizer();
let SUMMARIZER_MESSAGE;
document.addEventListener('DOMContentLoaded', function() {
    SUMMARIZER_MESSAGE = document.getElementById('summarizer-message');

    document.getElementById('summarizer-sharedContext').addEventListener('change', function() {
        const sharedContextValue = this.value;
        SUMMARIZER.setSharedContext(sharedContextValue);
    });
    document.getElementById('summarizer-type').addEventListener('change', function() {
        const typeValue = this.value;
        SUMMARIZER.setType(typeValue);
    });
    document.getElementById('summarizer-format').addEventListener('change', function() {
        const formatValue = this.value;
        SUMMARIZER.setFormat(formatValue);
    });;
    document.getElementById('summarizer-length').addEventListener('change', function() {
        const lengthValue = this.value;
        SUMMARIZER.setLength(lengthValue);
    });

    document.getElementById('summarizer-form').addEventListener('submit', function(event) {
        event.preventDefault();
        SUMMARIZER_MESSAGE.innerHTML = '';
        const formData = new FormData(event.target);
        let text = '';
        let context = '';
        formData.forEach((value, key) => {
            if(key === 'text') {
                text = value;
            }
            if(key === 'context') {
                context = value;
            }
        });
        let aiText = document.createElement('div');
        aiText.className = 'message ai';
        aiText.appendChild(loader);
        SUMMARIZER_MESSAGE.appendChild(aiText);         
        Promise.resolve(SUMMARIZER.summarize(text, context)).then((response) => {
            aiText.removeChild(loader);
            aiText.innerHTML = convertTextToHTML(response);
        }
        ).catch((error) => {
            aiText.removeChild(loader);
            aiText.classList.remove('ai');
            aiText.classList.add('error');
            aiText.textContent = `Error: ${error.message}`;
        });
    });
});

let DETECTOR = new NanoAI.NanoAILanguageDetector();
let DETECTOR_MESSAGE;
document.addEventListener('DOMContentLoaded', function() {
    DETECTOR_MESSAGE = document.getElementById('detector-message');

    document.getElementById('detector-form').addEventListener('submit', function(event) {
        event.preventDefault();
        DETECTOR_MESSAGE.appendChild(loader);
        const formData = new FormData(event.target);
        let text = '';
        formData.forEach((value, key) => {
            if(key === 'text') {
                text = value;
            }
        });
        let aiText = document.createElement('div');
        aiText.className = 'message ai';
        aiText.appendChild(loader);
        DETECTOR_MESSAGE.appendChild(aiText);
        Promise.resolve(DETECTOR.detect(text)).then((response) => {
            aiText.removeChild(loader);
            let result = document.createElement('table');
            let header = document.createElement('thead');
            let headerRow = document.createElement('tr');
            let headerLanguage = document.createElement('th');
            headerLanguage.textContent = 'Language';
            let headerConfidence = document.createElement('th');
            headerConfidence.textContent = 'Confidence';
            headerRow.appendChild(headerLanguage);
            headerRow.appendChild(headerConfidence);
            header.appendChild(headerRow);
            result.appendChild(header);

            let body = document.createElement('tbody');
            for (const result of response) {
                let row = document.createElement('tr');
                let language = document.createElement('td');
                language.textContent = result.detectedLanguage;
                let confidence = document.createElement('td');
                confidence.textContent = result.confidence;
                row.appendChild(language);
                row.appendChild(confidence);
                body.appendChild(row);
            }
            result.appendChild(body);

            aiText.appendChild(result);    
        }
        ).catch((error) => {
            aiText.removeChild(loader);
            aiText.classList.remove('ai');
            aiText.classList.add('error');
            aiText.textContent = `Error: ${error.message}`;
        });
    });
});