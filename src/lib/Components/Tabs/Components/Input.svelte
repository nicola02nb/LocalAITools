<script lang="ts">
    let { value = $bindable(), ...props } = $props();
</script>

<div>
    <label for="{props.name}">{props.label}</label>
    {#if props.type === "select"}
        <select name={props.name} id={props.name} bind:value={value}>
            {#if props.options.length > 0}
                <option value="" disabled selected>Select an option</option>
            {/if}
            {#each props.options as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    {:else if props.type === "checkbox"}
        <input type="checkbox" name={props.name} id={props.name} bind:checked={value}/>
    {:else}
        <input bind:value={value} id={props.name} {...props}/>
    {/if}
</div>