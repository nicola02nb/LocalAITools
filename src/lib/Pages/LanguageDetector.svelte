<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAILanguageDetector } from "../api/nano-ai";
    import Output from "./Components/Output.svelte";
    import { inputs, settings } from './shared';

    const templateSettings: object[] = [];

    const templateInputs = [{
        name: "detector-text",
        label: "Text to detect:",
        type: "text",
        value: "",
        placeholder: "Enter text to detect language...",
        required: true,
    }];

    const LANGUAGE_DETECTOR = new NanoAILanguageDetector();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        LANGUAGE_DETECTOR.reInit($settings["detector"]);
    });

    let submit = async (e: Event) => {
        output = "";
        elaborating = true;
        const res = await LANGUAGE_DETECTOR.detect($inputs[""]["detector-text"]);
        output = `<table><tr><th>Language</th><th>Confidence</th></tr>`;
        res.forEach((item: { detectedLanguage: string, confidence: number}) => {
            output += `<tr><td>${item.detectedLanguage}</td><td>${(item.confidence*100).toFixed(2)}%</td></tr>`;
        });
        output += `</table>`;
        elaborating = false;
    };
</script>

<Title title="Language Detector" ai={LANGUAGE_DETECTOR} tabName="detector" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating} />