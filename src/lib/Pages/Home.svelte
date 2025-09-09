<script>
    import { marked } from "marked";
    import { onMount } from 'svelte';
    import Output from "./Components/Output.svelte";
    
    let makdownFile = "# Loading...\n\nPlease wait while the README is loading.";
    let content = $state("");
    let error = $state("");

    let elaborating = $state(true);
    
    onMount(async () => {
        content = await marked(makdownFile);
        try {
            const response = await fetch('/README.md');
            if (response.ok) {
                makdownFile = await response.text();
            } else {
                makdownFile = "# Error\n\nCould not load the README file.";
            }
            elaborating = false;
        } catch (err) {
            console.error("Failed to load README:", err);
            error = "# Error\n\nCould not load the README file.";
            elaborating = false;
        }
        content = await marked(makdownFile);
    });
</script>

<Output tabName="home" error={error} elaborating={elaborating} content={content} />