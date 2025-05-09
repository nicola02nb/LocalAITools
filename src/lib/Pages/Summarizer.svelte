<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAISummarizer } from "../api/nano-ai";
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
        name: "type",
        label: "Type:",
        type: "select",
        value: "key-points",
        options: [
            { value: "key-points", label: "Key Points" },
            { value: "tl;dr", label: "TL;DR" },
            { value: "teaser", label: "Teaser" },
            { value: "headline", label: "Headline" },
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
    }];

    const templateInputs = [{
        name: "context",
        label: "Context:",
        type: "text",
        placeholder: "Enter context...",
        required: false,
    },    
    {
        name: "summarizer-text",
        label: "Text to summarize:",
        type: "text",
        placeholder: "Enter text to summarize...",
        required: true,
    }];
    
    const SUMMARIZER = new NanoAISummarizer();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        SUMMARIZER.reInit($settings["summarizer"]);
    });

    let submit = async (e: Event) => {
        let input = $inputs["summarizer"];
        const message = input["summarizer-text"];
        output = "";
        elaborating = true;
        if ($generalSettings.streamOutput) {
            let stream = SUMMARIZER.summarizeStreaming(message);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                output = await marked(res);
                await new Promise(resolve => setTimeout(resolve, $generalSettings.delayForStream));
            }
        } else {
            let res = await SUMMARIZER.summarize(message);
            output = await marked(res);
        }
        elaborating = false;
    };
</script>

<Title title="Summarizer" tabName="summarizer" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating} />