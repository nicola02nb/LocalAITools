<script lang="ts">
    import { marked } from "marked";

    import { EnumAiTabs, inputs, settings, generalSettings } from "../shared";
    import Input from "./Input.svelte";
    
    import { untrack } from "svelte";

    import * as nanoAI from "../../api/nano-ai";
    import { nameToInputs, nameToSettings } from "../InputsPreset";
    
    let { title = $bindable(), tabName = $bindable(), elaborating = $bindable(), messages = $bindable(), error = $bindable() } = $props();

    let inputsInit = $derived(nameToInputs[tabName as EnumAiTabs]);
    let settingsInit = $derived(nameToSettings[tabName as EnumAiTabs]);
    let optionsOpen = $state(false);
    
    let isAvaliable = $state("unavailable");    
    let downloadProgress = $state(0);

    type MapNameToClassKey = keyof typeof nanoAI.mapNameToClass; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let AI: nanoAI.ApiBase<any, any, any, any, any> = $derived.by(() => {
        return new nanoAI.mapNameToClass[title as MapNameToClassKey]($settings[tabName]);
    });

    $effect.pre(() => {
        if (tabName === "home" && tabName === "settings") return;
        error = "";
        messages = [];
        downloadProgress = 0;
        isAvaliable = "unavailable";
        elaborating = false;
    });
    
    function setDownloadProgress(e: { loaded: number; }) {
        downloadProgress = e.loaded;
    }

    function reinitializeAI() {
        if (tabName === "translator"){
            isAvaliable = "toCheck";
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
            if (!$inputs[tabName]) {
                untrack(() => $inputs)[tabName] = {};
            }
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
            } else {
                const val = $settings[tabName][setting.name];
                if (typeof val === "string" || typeof val === "number") {
                    setting.value = val;
                }
            }
        }
        reinitializeAI();
    });

    async function detectLanguage(text: string) {
        const LANGUAGE_DETECTOR = new nanoAI.ApiLanguageDetector();
        await LANGUAGE_DETECTOR.reInit();
        const detected = await LANGUAGE_DETECTOR.detect(text);
        return detected?.[0].detectedLanguage || "en";
    }

    let submit = async (e: Event) => {
        const input = $inputs[tabName];
        const text = input[tabName+"-text"];
        const target = e.target as HTMLFormElement;

        const images: FileList | null = target.querySelector<HTMLInputElement>("#images")?.files || null;
        const audios: FileList | null = target.querySelector<HTMLInputElement>("#audios")?.files || null;

        let sourceLanguage: string = String($settings["translator"]?.["sourceLanguage"] || "");
        let targetLanguage: string = String($settings["translator"]?.["targetLanguage"] || "");

        if (tabName !== "lm") messages = [];

        let lmInputs: LanguageModelMessageContent[] = [];
        lmInputs.push({ type: "text", value: text });
        if (tabName === "lm") {
            if (images) {
                lmInputs.push(...Array.from(images).map(file => ({ type: "image" as LanguageModelMessageType, value: file })));
            }
            if (audios) {
                lmInputs.push(...Array.from(audios).map(file => ({ type: "audio" as LanguageModelMessageType, value: file })));
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
            }            
        } else {
            return;
        }
        
        target.reset();
        messages.push({ role: "user", content: lmInputs });

        let aiResponse = $state({
            type: "text",
            value: "",
        });
        messages.push({ role: "system", content: [aiResponse] });

        let forCall: nanoAI.ModelInput = text;
        if (tabName === "lm") {
            const lmMessage: LanguageModelMessage = {
                role: "user",
                content: lmInputs,
            }
            const lmPrompt: LanguageModelMessage[] = [lmMessage];
            forCall = lmPrompt;
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
            } else {
                res = res as string;
                aiResponse.value = await marked(res);
            }
        } else {
            console.error(`AI class for ${tabName} does not have a call or callStream method.`);
        }
        elaborating = false;
    };
</script>

<div class="title-container" class:exists={AI?.exists}>
    <div class="inputs">
        <h1>{title}</h1>
        {#if isAvaliable === "unavailable"}
            <p class="unavailable">Unavailable</p>
        {:else if isAvaliable === "downloading"}
            <p class="downloading">Downloading {Math.round(downloadProgress * 100)}%</p>
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
            {#if tabName === "lm"}
                <label for="images">Images</label>
                <input type="file" id="images" name="images" multiple accept="image/*" />
                <br>
                <label for="audios">Audios</label>
                <input type="file" id="audios" name="audios" multiple accept="audio/*" />
            {/if}
            <button class="submit" type="submit">Send</button>
            <button class="stop" type="reset" onclick={() => AI.abort("Stopped by user")}>Stop</button>
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

    .downloading {
        color: #ffff00;
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
</style>