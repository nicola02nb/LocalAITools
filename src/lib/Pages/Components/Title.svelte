<script lang="ts">
    import { settings, inputs } from "../shared";
    import Input from "./Input.svelte";
    
    import type { NanoAIBase } from "../../api/nano-ai";
    
    let { title, tabName, settingsInit, inputsInit, submit, ai } = $props();

    ai = ai as NanoAIBase;

    let isAvaliable = $state("unavailable");    

    if ( ai.availability.then) {
        ai.availability?.then((res: string) => {
            isAvaliable = res;
        });
    }
    

    let optionsOpen = $state(true);

    for (const input of inputsInit) {
        if (!$inputs[tabName]) {
            $inputs[tabName] = {};
        }
        if (!$inputs[tabName][input.name]) {
            $inputs[tabName][input.name] = input.value;
        }
    }
    if (!$settings[tabName]) {
        $settings[tabName] = {};
    }
    for (const setting of settingsInit) {
        if (!$settings[tabName][setting.name]) {
            $settings[tabName][setting.name] = setting.value;
        } else{
            setting.value = $settings[tabName][setting.name];
        }
    }
</script>

<div class="title-container" class:exists={ai.exists}>
    <div>
        <h1>{title}</h1>
        {#if isAvaliable === "unavailable"}
            <p class="unavailable">Unavailable</p>
        {/if}
        <h2>Inputs</h2>
        <form onsubmit={(e) => { e.preventDefault(); submit(e); }}>
            {#each inputsInit as input (input.name)}
                <Input bind:value={$inputs[tabName][input.name]} {...input}/>
            {/each}
            <button class="submit" type="submit">Send</button>
            <button class="stop" type="reset" onclick={() => ai.abort("Stopped by user")}>Stop</button>
        </form>
    </div>
    {#if settingsInit.length > 0}
        <button class="options-button" aria-label="Open Settings" onclick={() => optionsOpen = !optionsOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
        </button>
        <div class="options-container" class:hidden={!optionsOpen}>
            <div class="option-item">
                {#each settingsInit as setting (setting.name)}
                    <Input bind:value={$settings[tabName][setting.name]} {...setting}/>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .title-container {
        display: grid;
        grid-template-columns: 1fr min-content auto;
        padding: 5px 0 5px 5px;
    }

    .title-container:not(.exists) {
        filter: grayscale(1);
    }

  
    h1{
        margin-top: 0;
    }

    .unavailable {
        color: red;
        font-size: 0.8em;
    }

    @keyframes expand{
        0% { width: 0; }
        100% { width: 50vw; }
    }

    @keyframes compress{
        0% { width: 50vw; }
        100% { width: 0; }
    }

    .options-container{
        transition: 0.5s;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 10px;
    }

    .options-container:not(.hidden) {
        width: 30vw;
    }

    .options-container.hidden {
        width: 0;
        overflow: hidden;
        padding: 0;
    }

    .options-button {
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
</style>