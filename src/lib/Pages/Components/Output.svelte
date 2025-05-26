<script lang="ts">
  import MediaOutput from "./MediaOutput.svelte";

    let { error = "", content="", messages = [], elaborating = true } = $props();

    $effect(() => {
        if (!elaborating){
            const loaders = document.getElementsByClassName("loader");
            for (const loader of loaders) {
                loader.remove();
            }
        }
    });
</script>

<div class="output scrollable">
    {#if error}
        <div class="error">{error}</div>
    {/if}
    {#if messages.length > 0}
        {#each messages as message, index (index)}
            <div class="message {message.role}">
                <h6>{message.role}</h6>
                {#if message.role === "system"}
                    <div class="loader" class:loading={elaborating}></div>
                {/if}
                {#each message.content as input, index (index)}
                {#if input.type === "text"}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        <div class="text">{@html input.value}</div>
                    {:else}
                        <MediaOutput type={input.type} content={input.value} />
                    {/if}
                {/each}
            </div>
        {/each}
    {:else if content}
        <div class="loader" class:loading={elaborating}></div>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div>{@html content}</div>
    {/if}
</div>

<style>
    .scrollable {
        flex-grow: 1;
        overflow: auto;
        background: rgba(0,0,0,0.1);
        padding: 10px;
    }

    .output {
        border-radius: 10px;
    }
    .output:last-child .message > .loader.loading {
        width: 1rem;
        padding: 8px;
        aspect-ratio: 1;
        border-radius: 50%;
        background: #e0e0e0;
        --_m:
            conic-gradient(#0000 10%, #000),
            linear-gradient(#000 0 0) content-box;
        -webkit-mask: var(--_m);
        mask: var(--_m);
        -webkit-mask-composite: source-out;
        mask-composite: subtract;
        animation: l3 1s infinite linear;
    }

    @keyframes l3 {
        to {
            transform: rotate(1turn)
        }
    }

    .message{
        padding: 10px;
        margin: 5px 0;
        border-radius: 5px;
        background: rgba(0,0,0,0.1);
        position: relative;
    }

    .message.system {
        background: rgba(0,0,0,0.1);
    }
    .message.user {
        background: rgba(0,0,0,0.3);
        text-align: right;
    }
</style>