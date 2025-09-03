<script lang="ts">
    import Head from "./Components/Head.svelte";
    import Output from "./Components/Output.svelte";

    import { type AiTab, tabNames } from "../stores/ActiveTab";
    import { messages } from "../stores/PageData";

    let { tabName }: { tabName: AiTab } = $props();

    let title = $derived(tabNames[tabName]);

    let elaborating = $state(false);

    let error: string = $state("");
</script>

<Head bind:title={title} bind:tabName={tabName} bind:elaborating={elaborating} bind:error={error}/>
<Output bind:tabName={tabName} elaborating={elaborating} error={error}/>