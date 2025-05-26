<script lang="ts">
    import { generalSettings } from "./shared";
    import Input from "./Components/Input.svelte";
</script>

<main>
    <h1>Extension Settings</h1>
    <h2>Sidepanel</h2>
    <Input type="checkbox" name="sharedSidepanel" label="Shared sidepanel:" bind:value={$generalSettings.sharedSidepanel} decription="If enabled the sidepanel wil be shared across all tabs"/>
    <h2>Text Output</h2>
    <Input type="checkbox" name="streamOutput" label="Output streamed:" bind:value={$generalSettings.streamOutput}/>
    <Input type="number" name="delayForStream" label="Delay between words(ms):" bind:value={$generalSettings.delayForStream} step=25 min=0/>
</main>