<script lang="ts">
    import { fade } from 'svelte/transition';

    let { contentId = "" } = $props();

    let copied = $state(false);
    $effect(() => {
        if (copied) {
            setTimeout(() => {
                copied = false;
            }, 1000);
        }
    });

    function copyToClipboard() {
        const textElement = document.getElementById(contentId) as HTMLElement;
        if (textElement) {
            const text = textElement.textContent;
            if (text) navigator.clipboard.writeText(text).then(() => {
                copied = true;
            }).catch((err) => {
                console.error("Failed to copy text: ", err);
            });
        }
    }
</script>

<button class="copy-to-clipboard" aria-label="Copy to Clipboard" onclick={copyToClipboard}>
    {#if copied}
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--primary)" in:fade><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
    {:else}
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--primary)" in:fade><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>
    {/if}
</button>

<style>
    .copy-to-clipboard {
        right: 7px;
        top: 7px;
        height: min-content;
        background: var(--secondary-transparent);
        color: var(--primary);
        border: none;
        border-radius: 5px;
        padding: 3px 5px;
        cursor: pointer;
    }
    .copy-to-clipboard:hover {
        background: var(--secondary);
    }
</style>