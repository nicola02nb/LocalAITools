<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAIWriter } from "../api/nano-ai";
    import Output from "./Components/Output.svelte";
    import { marked } from "marked";
    import { inputs, settings, generalSettings } from './shared';

    const templateSettings = [{
        name: "sharedContext",
        label: "Shared Context:",
        type: "text",
        value: "",
        placeholder: "Enter shared context...",
        required: false,
    },{
        name: "tone",
        label: "Tone:",
        type: "select",
        value: "neutral",
        options: [
            { value: "formal", label: "Formal" },
            { value: "neutral", label: "Neutral" },
            { value: "casual", label: "Casual" },
        ],
    },{
        name: "length",
        label: "Length:",
        type: "select",
        value: "short",
        options: [
            { value: "short", label: "Short" },
            { value: "medium", label: "Medium" },
            { value: "long", label: "Long" },
        ],
    },{
        name: "format",
        label: "Format:",
        type: "select",
        value: "plain-text",
        options: [
            { value: "plain-text", label: "Plain Text" },
            { value: "markdown", label: "Markdown" },
        ],
    }];

    const templateInputs = [{
        name: "writer-text",
        label: "Text to write:",
        type: "text",
        value: "",
        placeholder: "Enter text to write...",
        required: true,
    }];
    
    const WRITER = new NanoAIWriter();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        WRITER.reInit($settings["translate"]);
    });

    let submit = async (e: Event) => {
        let input = $inputs["translate"];
        const message = input["translate-text"];
        output = "";
        elaborating = true;
        if ($generalSettings.streamOutput) {
            let stream = WRITER.writeStreaming(message);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                output = await marked(res);
                await new Promise(resolve => setTimeout(resolve, $generalSettings.delayForStream));
            }
        } else {
            let res = await WRITER.write(message);
            output = await marked(res);
        }
        elaborating = false;
    };
</script>

<Title title="Translator" tabName="translate" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating} />