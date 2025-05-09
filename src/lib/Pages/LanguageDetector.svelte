<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAILanguageDetector } from "../api/nano-ai";
    import Output from "./Components/Output.svelte";
    import { inputs, settings } from './shared';

    const templateSettings: any[] = [];

    const templateInputs = [{
        name: "detector-text",
        label: "Text to detect:",
        type: "text",
        value: "",
        placeholder: "Enter text to detect language...",
        required: true,
    }];

    const LD = new NanoAILanguageDetector();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        LD.reInit($settings["detector"]);
    });

    let submit = async (e: Event) => {
        output = "";
        elaborating = true;
        const res = await LD.detect($inputs["detector-text"]);
        output = `<table><tr><th>Language</th><th>Confidence</th></tr>`;
        res.forEach((item: any) => {
            output += `<tr><td>${item.detectedLanguage}</td><td>${(item.confidence*100).toFixed(2)}%</td></tr>`;
        });
        output += `</table>`;
        elaborating = false;
    };
</script>

<Title title="Language Detector" tabName="detector" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating} />