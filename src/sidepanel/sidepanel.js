import { convertTextToHTML, convertTextToHTMLTokens } from '../lib/llmToHtml.js';
import * as NanoAI from '../lib/nano-ai.js';

var buttons;
var panes = document.getElementsByClassName('tab-pane');

const loader = document.createElement('div');
loader.className = 'loader';

function isAvailable(type) {
    const mapping = {
        'lm': 'languageModel',
        'summarizer': 'summarizer',
        'detector': 'languageDetector',
        'translate': 'translator',
        'writer': 'writer',
        'rewriter': 'rewriter'
    };
    return window?.ai?.[mapping[type]] || type === 'home' || type === 'settings';
}

function createButton(type){
    let button = document.createElement('button');
    button.className = 'tab-button';
    button.innerHTML = type.charAt(0).toUpperCase() + type.slice(1);
    button.setAttribute('data-tab', type);
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const tabId = this.getAttribute('data-tab');
        activateTab(tabId);
        chrome.storage.local.set({ lastTab: tabId });
    });
    return button;
}

function initializeButtons() {
    const buttonContainer = document.getElementById('tab-buttons');
    const types = ['home', 'lm', 'summarizer', 'detector', 'translate', 'writer', 'rewriter', 'settings'];
    for (const type of types) {
        if (!isAvailable(type)) continue;
        let button = createButton(type);
        buttonContainer.appendChild(button);
    }
    chrome.storage.local.get('lastTab').then((result) => {
        const lastTab = result.lastTab || 'home';
        activateTab(lastTab);
    });
}

function activateTab(tabId) {
    for (const button of buttons) {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
    for (const pane of panes) {
        if (pane.getAttribute('id') === tabId) {
            pane.classList.remove('hidden');
        } else {
            pane.classList.add('hidden');
        }
    }
}

function setInputValue(input, value) {
    if (input.type === 'checkbox') {
        input.checked = value;
    } else if (input.type === 'number') {
        input.value = parseFloat(value);
    } else {
        input.value = value;
    }
}

function getInputValue(input) {
    if (input.type === 'checkbox') {
        return input.checked;
    } else if (input.type === 'number') {
        return parseFloat(input.value);
    } else {
        return input.value;
    }
}

function passTextToTab(key, value) {
    document.getElementById(key+"-text").value = value;
    activateTab(key);
    let toPass = {};
    toPass[key] = undefined;
    chrome.storage.local.set({ toPass: toPass});
    document.getElementById(key+"-form").dispatchEvent(new Event('submit'));
}

async function streamResponse(response, element) {
    const stream = response;
    try {
        for await (const chunk of stream) {
            const htmlTokens = convertTextToHTMLTokens(chunk);
            for (const token of htmlTokens) {
                element.innerHTML += token+" ";
                await new Promise(resolve => setTimeout(resolve, settings.delayForStream));
            }            
        }
    } catch (error) {
        element.classList.remove('ai');
        element.classList.add('error');
        element.innerHTML += `<br>Error: ${error.message}</div>`;
        updateTokensStatus();
    }
}

const settings = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
    buttons = document.getElementsByClassName('tab-button');

    let optionsButttons = document.getElementsByClassName('options-button');
    for (const button of optionsButttons) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const options = this.parentNode.getElementsByClassName('options')[0];
            options.classList.toggle('hidden');
        });
    }

    const inputs = document.querySelectorAll('input, select');
    chrome.storage.local.get("settings").then((result) => {
        const settingsLocal = result.settings || {};
        for (const input of inputs) {
            if (settingsLocal?.[input.id] !== undefined){
                setInputValue(input, settingsLocal[input.id]);
                settings[input.id] = settingsLocal[input.id];
            }
        }
    });
    for (const input of inputs) {
        if (!input.id.endsWith('-text')) {
            input.addEventListener('change', function() {
                chrome.storage.local.get('settings').then((result) => {
                    const settingsLocal = result.settings || {};
                    settingsLocal[this.id] = getInputValue(this);
                    settings[this.id] = getInputValue(this);
                    chrome.storage.local.set({ settings: settingsLocal });
                });
            });
        }
    }

    chrome.storage.local.get('toPass').then((result) => {
        const toPass = result.toPass || {};
        for (const key in toPass) {
            passTextToTab(key, toPass[key]);
        }
    });
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local' || !changes.toPass) return;
        for (let [key, value] of Object.entries(changes.toPass.newValue)) {
            passTextToTab(key, value);
        }
    });
});

const LM = new NanoAI.NanoAILanguageModel();
const LM_MESSAGES  = document.getElementById('lm-messages');

function updateTokensStatus() {
    const tokensStatus = LM.getTokensStatus();
    const tokensUsed = document.getElementById('lm-tokens-used');
    const tokensMax = document.getElementById('lm-tokens-max');  
    
    tokensUsed.textContent = `Used: ${tokensStatus.used}`;
    tokensMax.textContent = `Max: ${tokensStatus.max}`;
}

document.addEventListener('DOMContentLoaded', function() {
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
    
    const lmForm = document.getElementById('lm-form');
    lmForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        let text = '';
        formData.forEach((value, key) => {
            if(key === 'text') {
                text = value;
            }
        });
        document.getElementById('lm-text').value = '';
        let userText = document.createElement('div');
        userText.textContent = text;
        userText.className = 'message user';
        LM_MESSAGES.appendChild(userText);
        let aiText = document.createElement('div');
        aiText.className = 'message ai';
        aiText.appendChild(loader);
        LM_MESSAGES.appendChild(aiText);
        await LM.init();
        if(settings.streamOutput) {
            aiText.removeChild(loader);
            await streamResponse(LM.promptStreaming(text), aiText);
            updateTokensStatus();
        } else {
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
                updateTokensStatus();
            });
        }
    });
    lmForm.addEventListener('reset', function(event) {
        event.preventDefault();
        LM.abort();
    });

});

const SUMMARIZER = new NanoAI.NanoAISummarizer();
const SUMMARIZER_MESSAGE = document.getElementById('summarizer-message');
document.addEventListener('DOMContentLoaded', function() {
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

    document.getElementById('summarizer-form').addEventListener('submit', async function(event) {
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
        await SUMMARIZER.init(); 
        if(settings.streamOutput) {
            aiText.removeChild(loader);
            await streamResponse(SUMMARIZER.summarizeStreaming(text), aiText);
        } else {
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
        }        
    });
});

const DETECTOR = new NanoAI.NanoAILanguageDetector();
const DETECTOR_MESSAGE = document.getElementById('detector-message');
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('detector-form').addEventListener('submit', async function(event) {
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
        await DETECTOR.init();
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


const home = document.getElementById('home');
async function loadReadme() {
    try {
        const response = await fetch(chrome.runtime.getURL('README.md'));
        if (response.ok) {
            const content = await response.text();
            home.innerHTML = convertTextToHTML(content);
        } else {
            console.error('Failed to load README.md:', response.status);
            home.innerHTML += '<p>Failed to load README content.</p>';
        }
    } catch (error) {
        console.error('Error loading README.md:', error);
        home.innerHTML += '<p>Error loading README content.</p>';
    }
}
loadReadme();