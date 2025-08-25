<script lang="ts">
    let { value = $bindable(), description = "", ...props  } = $props();
</script>

<div class="input-container">
    <label for="{props.name}">{props.label}</label>
    {#if props.type === "button"}
        <button id={props.name} {...props}>{props.placeholder}</button>
    {:else if props.type === "select"}
        {#if props.multiple}
            <select name={props.name} id={props.name} bind:value={value} multiple>
                {#if props.options && props.options.length > 0}
                    <option value="" disabled selected>Select an option</option>
                    {#each props.options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                {/if}
            </select>
        {:else}
            <select name={props.name} id={props.name} bind:value={value}>
                {#if props.options && props.options.length > 0}
                    <option value="" disabled selected>Select an option</option>
                    {#each props.options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                {/if}
            </select>
        {/if}
    {:else if props.type === "checkbox" && typeof value === "boolean"}
        <input type="checkbox" name={props.name} id={props.name} bind:checked={value}/>
    {:else if props.type === "textarea" && typeof props.value === "string"}
        <textarea bind:value={value} id={props.name} name={props.name} placeholder={props.placeholder} required={props.required}></textarea>
    {:else}
        {#if props.type === "range"}
            <output for={props.name}>{value}</output>
        {/if}
        <input bind:value={value} id={props.name} {...props}/>
    {/if}
    {#if description}
        <span class="description">{description}</span>
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
        font-family: inherit;
        font-size: 1em;
    }

    input[type="text"],textarea{
        width: 100%;
    }
    textarea {
        resize: vertical;
    }

    .description {
        font-size: 0.8em;
        font-style: italic;
        color: var(--secondary-transparent);
        margin-left: 10px;
    }
    
</style>