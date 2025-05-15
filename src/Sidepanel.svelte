<script lang="ts">
  import { activeTab, inputs, settings, generalSettings } from "./lib/Pages/shared";
  import Page from "./lib/Pages/Page.svelte";
  import Home from "./lib/Pages/Home.svelte";
  import Settings from "./lib/Pages/Settings.svelte";

  import { tabs } from "./lib/Pages/shared";
</script>

<main>
  {#if process.env.NODE_ENV === 'development'}
    <div>{JSON.stringify($generalSettings)}</div>
    <div>{JSON.stringify($inputs)}</div>
    <div>{JSON.stringify($settings)}</div>
  {/if}
  <div class="tab-container">
      <div class="tab-buttons">
          {#each tabs as tab (tab)}
              <button class="tab-button" class:activeTab={$activeTab === tab} on:click={() => { $activeTab = tab }}>{tab}</button>
          {/each}
      </div>
      <div class="tab-content">
          {#if $activeTab === "home"}
              <Home/>
          {:else if $activeTab === "settings"}
              <Settings/>
          {:else}
              <Page/>
          {/if}
      </div>
  </div>
</main>

<style>
@import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap');

:root {
  font-family: 'League Spartan', Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  --primary: #242424;
  --primary-transparent: rgba(36, 36, 36, 0.7);
  --primary-transparent-light: rgba(36, 36, 36, 0.1);
  --secondary: #f1f1f1;
  --secondary-transparent: rgba(241, 241, 241, 0.7);
  --secondary-transparent-light: rgba(241, 241, 241, 0.1);

  color-scheme: light dark;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:global(body) {
  margin: 0;
  padding: 0;
  background-color: var(--primary);
  color: var(--secondary);
}

@media (prefers-color-scheme: light) {
  :root {
    --primary: #f1f1f1;
    --primary-transparent-dark: rgba(241, 241, 241, 0.9);
    --primary-transparent: rgba(241, 241, 241, 0.5);
    --primary-transparent-light: rgba(241, 241, 241, 0.1);

    --secondary: #242424;
    --secondary-transparent-dark: rgba(36, 36, 36, 0.9);
    --secondary-transparent: rgba(36, 36, 36, 0.5);
    --secondary-transparent-light: rgba(36, 36, 36, 0.1);
  }
}

.tab-container {
  background-color: var(--primary);
  color: var(--secondary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.tab-buttons {
  display: flex;
  flex-flow: row wrap;
  gap: 5px;
  padding: 0px;
}

.tab-button {
  background-color: var(--secondary-transparent-dark);
  border: none;
  border-radius: 5px 5px 0px 0px;
  padding: 10px;
  cursor: pointer;
  text-transform: uppercase;
}
.tab-button:hover {
  background-color: var(--secondary-transparent);
}
.tab-button.activeTab {
  background-color: var(--secondary-transparent-light) !important;
}

.tab-content {
  background-color: var(--secondary-transparent-light);
  flex-grow: 1;
  padding: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
