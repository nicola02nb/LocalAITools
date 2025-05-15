<script lang="ts">
    import { marked } from "marked";
    
    import Title from "./Components/Title.svelte";
    import Output from "./Components/Output.svelte";
    
    import * as nanoAI from "../api/nano-ai";
    import { nameToInputs, nameToSettings } from "./Page";
    import { activeTab, type EnumAiTabs, tabNames, inputs, settings, generalSettings } from "./shared";
    import { untrack } from "svelte";
    import { NanoAILanguageDetector } from "../api/nano-ai";

    let name: string = $derived($activeTab);
    
    let title = $derived(tabNames[name as EnumAiTabs]);
    
    let templateInputs = $derived(nameToInputs[name as EnumAiTabs]);

    let templateSettings = $derived(nameToSettings[name as EnumAiTabs]);

    let AI: nanoAI.NanoAIBase = $derived.by(() => {
        const aiObject = nanoAI.mapNameToClass[title];
        return aiObject;
    });

    let elaborating = $state(false);

    let error: string = $state("");
    let messages: { [key:string]: string}[] = $state([]);

    $effect(() => {
        error = "";
        messages = [];
        if (name === "translator") return;
        untrack(() => AI)?.reInit($settings[name]);
    });

    async function detectLanguage(text: string) {
        const LANGUAGE_DETECTOR = new NanoAILanguageDetector();
        await LANGUAGE_DETECTOR.reInit();
        const detected = await LANGUAGE_DETECTOR.detect(text);
        return detected?.[0].detectedLanguage || "en";
    }

    let submit = async (e: Event) => {
        const input = $inputs[name];
        const text = input[name+"-text"];
        const target = e.target as HTMLFormElement;

        if (name !== "lm"){
            messages = [];
        }
        if (name === "translator"){
            let sourceLanguage: string = String($settings["translator"]["sourceLanguage"]);
            let targetLanguage: string = String($settings["translator"]["targetLanguage"]);
            let ai = AI as nanoAI.NanoAITranslator;
            if (sourceLanguage === "auto") {
                sourceLanguage = await detectLanguage(text);
            }
            if (ai.areLanguagesChanged(sourceLanguage, targetLanguage)) {
                await AI.reInit({ sourceLanguage, targetLanguage });
            }
            await AI.reInit({ sourceLanguage, targetLanguage });
        }
        
        target.reset();
        messages.push({ role: "user", content: text });
        messages.push({ role: "ai", content: "" });
        elaborating = true;
        if ($generalSettings.streamOutput && AI.callStream) {
            let stream = AI.callStream(text);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                messages[messages.length-1] = { role: "lm", content: await marked(res) };
                await new Promise(resolve => setTimeout(resolve, Number($generalSettings.delayForStream)));
            }
        } else if (AI.call) {
            let res = await AI.call(text)
            if (name === "detector") {
                res = res as { detectedLanguage: string, confidence: number }[];
                let output = `<table><tr><th>Language</th><th>Confidence</th></tr>`;
                for (const item of res) {
                    output += `<tr><td>${item.detectedLanguage}</td><td>${(item.confidence*100).toFixed(2)}%</td></tr>`;
                }
                output += `</table>`;
                messages[messages.length-1].content = output;
            } else {
                res = res as string;
                messages[messages.length-1].content = await marked(res);
            }
        } else {
            console.error(`AI class for ${name} does not have a call or callStream method.`);
        }
        elaborating = false;
    };
</script>

<Title bind:title={title} bind:ai={AI} bind:tabName={name} bind:inputsInit={templateInputs} bind:settingsInit={templateSettings} submit={submit}/>
<Output elaborating={elaborating} error={error} messages={messages}/>

