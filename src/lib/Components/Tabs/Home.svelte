<script>
    import { marked } from "marked";
    import { onMount } from 'svelte';
    import Output from "./Components/Output.svelte";
    
    let makdownFile = "# Loading...\n\nPlease wait while the README is loading.";
    let content = $state("");

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
        } catch (error) {
            console.error("Failed to load README:", error);
            makdownFile = "# Error\n\nCould not load the README file.";
            elaborating = false;
        }
        content = await marked(makdownFile);
    });
</script>

<Output elaborating={elaborating} content={content}/>