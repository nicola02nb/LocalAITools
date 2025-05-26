<script lang="ts">
    let { value = $bindable(), decription = "",...props } = $props();
</script>

<div class="input-container">
    <label for="{props.name}">{props.label}</label>
    {#if props.type === "select"}
        <select name={props.name} id={props.name} bind:value={value}>
            {#if props.options.length > 0}
                <option value="" disabled selected>Select an option</option>
            {/if}
            {#each props.options as option (option.value)}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    {:else if props.type === "checkbox"}
        <input type="checkbox" name={props.name} id={props.name} bind:checked={value}/>
    {:else if props.type === "textarea"}
        <textarea bind:value={value} id={props.name} {...props}></textarea>
    {:else}
        {#if props.type === "range"}
            <output for={props.name}>{value}</output>
        {/if}
        <input bind:value={value} id={props.name} {...props}/>
    {/if}
    {#if decription}
        <span class="description">{decription}</span>
    {/if}
</div>

<style>
    .input-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 5px;
    }

    label {
        margin-right: 10px;
        font-weight: bold;
    }
    
    input, select, textarea {
        border: 2px solid var(--secondary-transparent);
        border-radius: 5px;
        padding: 5px;
        margin: 3px;
        accent-color: var(--secondary);
        width: max-content;
    }

    textarea {
        width: 100%;
        resize: vertical;
        font-family: inherit;
    }

    .description {
        font-size: 0.8em;
        font-style: italic;
        color: var(--secondary-transparent);
        margin-left: 10px;
    }
    
</style>