<script lang="ts">
    let { type, content } = $props();

    let src = $state("");

    async function loadFile(file: File): Promise<void> {
        if (!file) return;

        src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                if (reader.result) {
                    resolve(reader.result as string);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };

            reader.onerror = function () {
                reject(reader.error);
            };

            reader.readAsDataURL(file);
        });
    }

    loadFile(content);
</script>

<div class="media-output">
    {#if type === "image"}
        <img src={src} alt="response" />
    {:else if type === "audio"}
        <audio src={src} controls>
            <source type="audio/*">
            Your browser does not support the audio element.
        </audio>
    {:else if type === "video"}
        <video src={src} controls>
            <source type="video/*">
            <track kind="captions" label="English captions" src="" srclang="en" default>
            Your browser does not support the video tag.
        </video>
    {:else}
        <div>Unsupported media type: {type}</div>
    {/if}
</div>

<style>
    .media-output {
        display: flex;
        align-items: center;
        justify-content: center;
        width: min-content;
        margin: 10px;
        padding: 5px;
        border: 1px solid var(--secondary);
        border-radius: 8px;
        background-color: var(--secondary-transparent);
    }

    img, audio, video {
        border-radius: 3px;
        max-height: 50px;
        height: auto;
    }
</style>