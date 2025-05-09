<script lang="ts">
    import Title from "./Components/Title.svelte";
    import { NanoAIRewriter } from "../../api/nano-ai";
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
        value: "as-is",
        options: [
            { value: "as-is", label: "As Is" },
            { value: "more-formal", label: "More Formal" },
            { value: "more-creative", label: "More Creative" },
        ],
    },{
        name: "length",
        label: "Length:",
        type: "select",
        value: "as-is",
        options: [
            { value: "as-is", label: "As Is" },
            { value: "shorter", label: "Shorter" },
            { value: "longer", label: "Longer" },
        ],
    },{
        name: "format",
        label: "Format:",
        type: "select",
        value: "plain-text",
        options: [
            { value: "as-is", label: "As Is" },
            { value: "plain-text", label: "Plain Text" },
            { value: "markdown", label: "Markdown" },
        ],
    }];

    const templateInputs = [{
        name: "rewriter-text",
        label: "Text to rewrite:",
        type: "text",
        value: "",
        placeholder: "Enter text to rewrite...",
        required: true,
    }];
    
    const REWRITER = new NanoAIRewriter();
    let output = $state("");
    let elaborating = $state(false);

    $effect(() => {
        output = "";
        REWRITER.reInit($settings["rewriter"]);
    });

    let submit = async (e: Event) => {
        let input = $inputs["rewriter"];
        const message = input["rewriter-text"];
        output = "";
        elaborating = true;
        if ($generalSettings.streamOutput) {
            let stream = REWRITER.rewriteStreaming(message);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                output = await marked(res);
                await new Promise(resolve => setTimeout(resolve, $generalSettings.delayForStream));
            }
        } else {
            let res = await REWRITER.rewrite(message);
            output = await marked(res);
        }
        elaborating = false;
    };
</script>

<Title title="Rewriter" tabName="rewriter" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output content={output} elaborating={elaborating}/>