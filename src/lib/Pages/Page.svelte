<script lang="ts">
    import Head from "./Components/Head.svelte";
    import Output from "./Components/Output.svelte";
    
    import { activeTab, type AiTab, tabNames } from "./shared";

    let tabName: string = $derived($activeTab);
    
    let title = $derived(tabNames[tabName as AiTab]);

    let elaborating = $state(false);

    let error: string = $state("");
    let messages: { [key:string]: string}[] = $state([]);
</script>

<Head bind:title={title} bind:tabName={tabName} bind:elaborating={elaborating} bind:messages={messages} bind:error={error}/>
<Output elaborating={elaborating} error={error} messages={messages}/>