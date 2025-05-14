<script lang="ts">
    import { settings, inputs, generalSettings } from "./shared";
    import Title from "./Components/Title.svelte";
    import { NanoAILanguageModel } from "../api/nano-ai";
    import Output from "./Components/Output.svelte";
    import { marked } from "marked";

    const templateSettings = [{
        name: "temperature",
        label: "Temperature:",
        type: "number",
        value: 1,
        step: 0.1,
        min: 0,
        max: 2,
    },{
        name: "topK",
        label: "Top K:",
        type: "number",
        value: 3,
        step: 1,
        min: 1,
        max: 8,
    }];

    const templateInputs = [{
        name: "lm-text",
        label: "Message:",
        type: "text",
        value: "",
        placeholder: "Enter message...",
        required: true,
    }];
    
    const LANGUAGE_MODEL = new NanoAILanguageModel();
    let messages: {role :string, content: string}[]= $state([]);
    let elaborating = $state(false);

    $effect(() => {
        messages = [];
        LANGUAGE_MODEL.reInit($settings["lm"]);
    });

    let submit = async (e: Event) => {
        const input = $inputs["lm"];
        const text = input["lm-text"];
        const target = e.target as HTMLFormElement;
        target.reset();
        messages.push({ role: "user", content: text });
        messages.push({ role: "lm", content: "" });
        elaborating = true;
        if ($generalSettings.streamOutput) {
            
            let stream = LANGUAGE_MODEL.promptStreaming(text);

            let res = "";
            for await (const chunk of stream) {
                res += chunk;
                messages[messages.length-1] = { role: "lm", content: await marked(res) };
                await new Promise(resolve => setTimeout(resolve, Number($generalSettings.delayForStream)));
            }
        } else {
            let res = await LANGUAGE_MODEL.prompt(text);
            messages[messages.length-1].content = await marked(res);
        }
        elaborating = false;
    };
</script>

<Title title="Language Model" ai={LANGUAGE_MODEL} tabName="lm" settingsInit={templateSettings} inputsInit={templateInputs} submit={submit}/>
<Output elaborating={elaborating} messages={messages}/>