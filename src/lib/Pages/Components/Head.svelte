<script lang="ts">
    import { marked } from "marked";

    import { type AiTab, tabActions, apiDocs } from "../../stores/ActiveTab";
    import { generalSettings } from "../../stores/Settings";
    import { inputs, messages, settings } from "../../stores/PageData";
    import Input from "./Input.svelte";
    
    import { untrack } from "svelte";

    import * as nanoAI from "../../api/nano-ai";
    import { nameToInputs, nameToSettings } from "../../stores/InputsPreset";
    
    let { title = $bindable(), tabName = $bindable(), elaborating = $bindable(), error = $bindable() }
        :{ title: string; tabName: AiTab; elaborating: boolean; error: string; } = $props();

    let inputsInit = $derived(nameToInputs[tabName]);
    let settingsInit = $derived(nameToSettings[tabName]);
    let messagesInit = $state($messages[tabName]);
    let optionsOpen = $state(false);

    $effect(() => {
        $messages[tabName] = messagesInit;
    });

    let multimodalImages: FileList | null = $state(null);
    let multimodalAudios: FileList | null = $state(null);

    let isAvaliable = $state("unavailable");    
    let downloadProgress = $state(0);

    type MapNameToClassKey = keyof typeof nanoAI.mapNameToClass; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let AI: nanoAI.ApiBase<any, any, any, any, any> = $derived.by(() => {
        return new nanoAI.mapNameToClass[title as MapNameToClassKey]($settings[tabName]);
    });

    $effect.pre(() => {
        error = "";
        messagesInit = [];
        downloadProgress = 0;
        isAvaliable = "unavailable";
        elaborating = false;
        multimodalImages = null;
        multimodalAudios = null;
    });
    
    function setDownloadProgress(e: { loaded: number; }) {
        downloadProgress = Math.round(e.loaded * 100);
        if (downloadProgress >= 100) {
            isAvaliable = "available";
        }
    }

    function reinitializeAI() {
        if (tabName === "translator" || tabName === "proofreader"){
            if (!AI.exists){
                isAvaliable = "unavailable";
            }
            else {
                isAvaliable = "toCheck";
            }
            return;
        }
        AI.availability().then(async (status) => {
            isAvaliable = status;
            if (isAvaliable !== "unavailable") {
                isAvaliable = "downloading";
                await AI.reInit($settings[tabName], setDownloadProgress);
                isAvaliable = "available";
            }
        });
    }
    
    $effect.pre(() => {
        if (!$inputs[tabName]) {
            untrack(() => $inputs)[tabName] = {};
        }
        for (const input of inputsInit) {
            if (!$inputs[tabName][input.name]) {
                untrack(() => $inputs)[tabName][input.name] = String(input.value);
            }
        }
    });

    $effect.pre(() => {  
        if (!$settings[tabName]) {
            untrack(() => $settings) [tabName] = {};
        }
        for (const setting of settingsInit) {
            if (!$settings[tabName][setting.name]) {
                untrack(() => $settings) [tabName][setting.name] = setting.value;
            }
        }
        reinitializeAI();
    });

    async function detectLanguage(text: string) {
        const LANGUAGE_DETECTOR = new nanoAI.ApiLanguageDetector();
        await LANGUAGE_DETECTOR.reInit();
        const detected = await LANGUAGE_DETECTOR.detect(text) as LanguageDetectionResult[];
        return detected?.[0].detectedLanguage || "en";
    }

    let submit = async (e: Event) => {
        const input = $inputs[tabName];
        const text = input[tabName+"-text"];
        const target = e.target as HTMLFormElement;

        console.log(multimodalImages, multimodalAudios);

        let sourceLanguage: string = $settings["translator"]?.["sourceLanguage"] as string || "";
        let targetLanguage: string = $settings["translator"]?.["targetLanguage"] as string || "" ;
        let expectedInputLanguages: string[] = $settings["proofreader"]?.["expectedInputLanguages"] as string[] || [];
        let correctionExplanationLanguage: string = $settings["proofreader"]?.["correctionExplanationLanguage"] as string || "";

        if (tabName !== "prompt") messagesInit = [];

        let promptInputs: LanguageModelMessageContent[] = [];
        promptInputs.push({ type: "text", value: text });
        if (tabName === "prompt") {
            if (multimodalImages) {
                promptInputs.push(...Array.from(multimodalImages).map(file => ({ type: "image" as LanguageModelMessageType, value: file })));
            }
            if (multimodalAudios) {
                promptInputs.push(...Array.from(multimodalAudios).map(file => ({ type: "audio" as LanguageModelMessageType, value: file })));
            }
        }
        
        let availability;
        if (tabName === "translator"){
            if (sourceLanguage === "auto") {
                sourceLanguage = await detectLanguage(text);
            }
            if (targetLanguage === "auto") {
                targetLanguage = navigator.language.substring(0, 2);
            }
            if (sourceLanguage === targetLanguage) {
                error = "Source and target languages cannot be the same.";
                elaborating = false;
                return;
            }
            console.log(`Source Language: ${sourceLanguage}, Target Language: ${targetLanguage}`);
            availability = await AI.availability({ sourceLanguage, targetLanguage});
        } else if (tabName === "proofreader") {
            for (let index = 0; index < expectedInputLanguages.length; index++) {
                if (expectedInputLanguages[index] === "auto") expectedInputLanguages[index] = await detectLanguage(text);
            }
            if (correctionExplanationLanguage === "auto") {
                correctionExplanationLanguage = navigator.language.substring(0, 2);
            }
            console.log(`Expected Input Languages: ${expectedInputLanguages.join(", ")}, Correction Explanation Language: ${correctionExplanationLanguage}`);
            availability = await AI.availability({ expectedInputLanguages, correctionExplanationLanguage, includeCorrectionExplanations: $settings["proofreader"]?.["includeCorrectionExplanations"] });
        } else {
            availability = await AI.availability();
        }
        
        if (availability === "unavailable") {
            error = "AI model is unavailable.";
            isAvaliable = "unavailable";
            elaborating = false;
            return;
        } else if (availability === "downloadable") {
            error = "AI model is downloadable. Please wait until the download is complete.";
            isAvaliable = "downloadable";
            elaborating = false;
            downloadProgress = 0;
            if (tabName === "translator") {
                isAvaliable = "downloading";
                await AI.reInit({ sourceLanguage, targetLanguage }, setDownloadProgress);
                error = "";
                isAvaliable = "available";
                elaborating = true;
            } else {
                return;
            }
        } else if (availability === "downloading") {
            console.log(AI.serviceInstance);
            isAvaliable = "downloading";
        }
        
        if (availability === "available") {
            error = "";
            isAvaliable = "available";
            elaborating = true;
            if (tabName === "translator") {
                let ai = AI as nanoAI.ApiTranslator;
                if (ai.areLanguagesChanged(sourceLanguage, targetLanguage)) {
                    await AI.reInit({ sourceLanguage, targetLanguage }, setDownloadProgress);
                }
            } else if (tabName === "proofreader") {
                let ai = AI as nanoAI.ApiProofreader;
                if (ai.areLanguagesChanged(expectedInputLanguages, correctionExplanationLanguage)) {
                    await AI.reInit({ expectedInputLanguages, correctionExplanationLanguage, includeCorrectionExplanations: $settings["proofreader"]?.["includeCorrectionExplanations"] }, setDownloadProgress);
                }
            }
        } else {
            return;
        }
        
        target.reset();
        messagesInit.push({ role: "user", content: promptInputs });

        let aiResponse: LanguageModelMessageContent = $state({
            type: "text" as LanguageModelMessageType,
            value: "",
        });
        messagesInit.push({ role: "assistant", content: [aiResponse] });

        let forCall: nanoAI.ModelInput = text;
        if (tabName === "prompt" && $generalSettings.promptMultimodal) {
            const promptMessage: LanguageModelMessage = {
                role: "user",
                content: promptInputs,
            }
            const promptPrompt: LanguageModelMessage[] = [promptMessage];
            forCall = promptPrompt;
        } else {
            forCall = text;
        }

        if ($generalSettings.streamOutput && AI.callStream) {
            let stream = AI.callStream(forCall);

            let res = "";
            if (stream) {
                for await (const chunk of stream) {
                    res += chunk;
                    aiResponse.value = await marked(res);
                    await new Promise(resolve => setTimeout(resolve, Number($generalSettings.delayForStream)));
                }
            } else {
                console.error(`Stream result is not available for ${tabName}`);
            }
        } else if (AI.call) {
            let res = await AI.call(forCall)
            if (tabName === "detector") {
                res = res as LanguageDetectionResult[];
                let output = `<table><tr><th>Language</th><th>Confidence</th></tr>`;
                for (const item of res) {
                    output += `<tr><td>${item.detectedLanguage}</td><td>${(item.confidence ? (item.confidence*100).toFixed(2) : 0)}%</td></tr>`;
                }
                output += `</table>`;
                aiResponse.value = output;
            } else if (tabName === "proofreader") {
                aiResponse.value = res.correctedInput;
            } else {
                res = res as string;
                aiResponse.value = await marked(res);
            }
        } else {
            console.error(`AI class for ${tabName} does not have a call or callStream method.`);
        }
        elaborating = false;
    };

    function stop() {
        AI.abort("Stopped by user");
        elaborating = false;
    }

    function reset(){
        $inputs[tabName] = {};
        messagesInit = [];
        error = "";
        elaborating = false;
        downloadProgress = 0;
        multimodalImages = null;
        multimodalAudios = null;
        reinitializeAI();
    }
</script>

<div class="title-container" class:exists={AI?.exists}>
    <div class="inputs">
        <h1><a href={apiDocs[tabName]}>{title}</a></h1>
        {#if isAvaliable === "unavailable"}
            <p class="unavailable">Unavailable</p>
        {:else if isAvaliable === "toCheck"}
            <p class="toCheck">To check</p>
        {:else if isAvaliable === "downloading"}
            <p class="downloading">Downloading {downloadProgress}%</p>        
        {:else if isAvaliable === "downloadable"}
            <p class="downloadable">Downloadable</p>
        {:else if isAvaliable === "available"}
            <p class="available">Available</p>
        {/if}        
        <h2>Inputs</h2>
        <form onsubmit={(e) => { e.preventDefault(); submit(e); }}>
            {#each inputsInit as input (input.name)}
                <Input bind:value={$inputs[tabName][input.name]} {...(() => {
                    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
                    const { value, ...rest } = input;
                    return rest;
                })()}/>
            {/each}
            {#if tabName === "prompt"}
                <label for="useMultimodal">Multimodal</label>
                <input type="checkbox" id="useMultimodal" bind:checked={$generalSettings.promptMultimodal} />
                <br>
                {#if $generalSettings.promptMultimodal}
                    <label for="images">Images</label>
                    <input type="file" name="images" multiple accept="image/*" bind:files={multimodalImages} />
                    <br>
                    <label for="audios">Audios</label>
                    <input type="file" name="audios" multiple accept="audio/*" bind:files={multimodalAudios} />
                    <br>
                    <div>
                        {#if multimodalImages}
                            {#each Array.from(multimodalImages) as image, index (index)}
                                <img src={URL.createObjectURL(image)} alt={image.name} />
                            {/each}
                        {/if}
                        <br />
                        {#if multimodalAudios}
                            {#each Array.from(multimodalAudios) as audio, index (index)}
                                <audio controls>
                                    <source src={URL.createObjectURL(audio)} type={audio.type} />
                                    Your browser does not support the audio tag.
                                </audio>
                            {/each}
                        {/if}
                    </div>
                {/if}
            {/if}
            <button class="submit" type="submit">{tabActions[tabName as AiTab]}</button>
            <button class="stop" type="reset" onclick={stop}>Stop</button>
            <button class="reset" type="button" onclick={reset}>Reset</button>
        </form>
    </div>
    {#if settingsInit.length > 0}
        <div class="options">
            <button class="options-button" aria-label="Open Settings" onclick={() => optionsOpen = !optionsOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
            </button>
            <div class="options-container" class:hidden={!optionsOpen}>
                <div class="option-item">
                    {#each settingsInit as setting (setting.name)}
                        <Input bind:value={$settings[tabName][setting.name]} {...(() => {
                            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
                            const { value, ...rest } = setting;
                            return rest;
                        })()}/>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .title-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 10px 0 15px 15px;
    }

    .title-container:not(.exists) * {
        pointer-events: none;
    }

    .inputs {
        width: 100%;
    }   

    h1{
        margin-top: 0;
        margin-bottom: 0.4em;
    }

    h2 {
        margin: 0;
        font-size: 1.2em;
    }

    .unavailable {
        color: red;
        font-size: 0.8em;
    }

    .downloadable ,.downloading, .toCheck {
        color: #ffff00;
        font-size: 0.8em;
    }

    .available {
        color: green;
        font-size: 0.8em;
    }

    .options {
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: end;
        right: 0px;
        transform: translateY(-10px);
        padding: 0;
        position: absolute;
        pointer-events: none;
        z-index: 1;
    }

    .options-button {
        pointer-events: all;
        border: none;
        height: fit-content;
        border-radius: 50%;
        padding: 2px 2px 0 2px;
        margin: 5px;
    }
    .options-button:hover {
        cursor: pointer;
        filter: brightness(0.9);
    }
    .options-button > svg {
        fill: var("black");
    }
    .options-button:hover > svg {
        transform: rotate(360deg);
        transition: 1s;
    }

    .options-container{
        pointer-events: all;
        position: relative;
        display: flex;
        transition: 0.5s;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 10px 0 0 10px;
        padding: 10px;
        animation: all 0.5s ease-in-out;
    }

    .options-container.hidden {
        transform: translateX(97%);
        animation: all 0.5s ease-in-out;
    }

    form > br {
        height: 0px !important;
    }

    form > button{
        margin: 5px;
        padding: 5px 10px;
        border-radius: 5px;
        border: 2px solid var(--secondary-transparent-light);
        background-color: var(--secondary);
        color: var(--secondary);
        cursor: pointer;
        font-weight: bold;
    }
    form > button:hover {
        filter: brightness(1.5);
    }
    form > button.submit {
        background-color: #61be5580;
    }
    form > button.stop {
        background-color: #be555580;
    }
    form > button.reset {
        background-color: #bebc5580;
    }
</style>