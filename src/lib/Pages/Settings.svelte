<script lang="ts">
    import { generalSettings, resetSettings } from "../stores/Settings";
    import Input from "./Components/Input.svelte";
</script>

<main>
    <h1>Extension Settings</h1>
    <h2>Sidepanel</h2>
    <Input type="checkbox" name="sharedSidepanel" label="Shared sidepanel:" bind:value={$generalSettings.sharedSidepanel} decription="If enabled the sidepanel wil be shared across all tabs"/>
    <h2>Text Output</h2>
    <Input type="checkbox" name="streamOutput" label="Output streamed:" bind:value={$generalSettings.streamOutput}/>
    <Input type="number" name="delayForStream" label="Delay between words(ms):" bind:value={$generalSettings.delayForStream} step=25 min=0/>
    <h2>Language Model</h2>
    <Input type="checkbox" name="promptMultimodal" label="Use multimodal:" bind:value={$generalSettings.promptMultimodal}/>
    <h2>Overlay</h2>
    <Input type="checkbox" name="overlayEnabled" label="Overlay enabled:" bind:value={$generalSettings.overlayEnabled}/>
    <Input type="checkbox" name="overlayHideOnClick" label="Hide overlay on button click:" bind:value={$generalSettings.overlayHideOnClick}/>
    <h2>Reset</h2>
    <Input type="button" name="resetSettings" label="Reset to default settings:" placeholder="Reset" onclick={resetSettings}/>
</main>