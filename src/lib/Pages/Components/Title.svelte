<script lang="ts">
    import { inputs, settings } from "../shared";
    import Input from "./Input.svelte";
    
    import type { NanoAIBase } from "../../api/nano-ai";
    import { untrack } from "svelte";
    
    let { title = $bindable(), tabName = $bindable(), inputsInit = $bindable(), settingsInit = $bindable(), submit, ai = $bindable() } = $props();
    let AI = ai as NanoAIBase;

    let isAvaliable = $state("");  
    let downloadProgress = $state(0);

    let optionsOpen = $state(true);
    
    $effect.pre(() => {
        if (!$inputs[tabName]) {
            untrack(() => $inputs)[tabName] = {};
        }
        for (const input of inputsInit) {
            if (!$inputs[tabName]) {
                untrack(() => $inputs)[tabName] = {};
            }
            if (!$inputs[tabName][input.name]) {
                untrack(() => $inputs)[tabName][input.name] = input.value;
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
            } else{
                setting.value = $settings[tabName][setting.name];
            }
        }
    });
</script>

<div class="title-container" class:exists={AI?.exists}>
    <div>
        <h1>{title}</h1>
        {#if isAvaliable === "unavailable"}
            <p class="unavailable">Unavailable</p>
        {:else if isAvaliable === "downloading"}
            <p class="unavailable">Downloading {Math.round(downloadProgress * 100)}%</p>
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
        <div class="options">
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

    .title-container:not(.exists) {
        filter: grayscale(1);
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
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px 0 0 10px;
        padding: 10px;
        animation: all 0.5s ease-in-out;
    }

    .options-container.hidden {
        transform: translateX(97%);
        animation: all 0.5s ease-in-out;
    }    
</style>