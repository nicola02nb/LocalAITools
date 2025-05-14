<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAITranslator } from "../api/nano-ai";
    import Output from "./Components/Output.svelte";
    import { marked } from "marked";
    import { inputs, settings, generalSettings } from './shared';

    const templateSettings: never[] = [];

    const templateInputs = [{
        name: "translate-text",
        label: "Text to translate:",
        type: "text",
        value: "",
        placeholder: "Enter text to translate...",
        required: true,
    }];

    const TRANSLATER = new NanoAITranslator();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        TRANSLATER.reInit($settings["translate"]);
    });

    let submit = async (e: Event) => {
        const input = $inputs["translate"];
        const text = input["translate-text"];
        output = "";
        elaborating = true;
        if ($generalSettings.streamOutput) {
            let stream = TRANSLATER.translateStreaming(text);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                output = await marked(res);
                await new Promise(resolve => setTimeout(resolve, Number($generalSettings.delayForStream)));
            }
        } else {
            let res = await TRANSLATER.translate(text);
            output = await marked(res);
        }
        elaborating = false;
    };
</script>

<Title title="Translator" ai={TRANSLATER} tabName="translate" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating} />