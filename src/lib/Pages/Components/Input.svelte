<script lang="ts">
    let { value = $bindable(), ...props } = $props();
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
    {:else}
        {#if props.type === "range"}
            <output for={props.name}>{value}</output>
        {/if}
        <input bind:value={value} id={props.name} {...props}/>
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
    
    input {
        border: 2px solid;
        border-radius: 5px;
        padding: 5px;
        margin: 3px;
        accent-color: var(--secondary);
    }
    
</style>