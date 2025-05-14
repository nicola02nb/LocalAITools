<script lang="ts">
  import { activeTab, inputs, settings, generalSettings } from "./lib/Pages/shared";
  import Home from "./lib/Pages/Home.svelte";
  import LanguageDetector from "./lib/Pages/LanguageDetector.svelte";
  import LanguageModel from "./lib/Pages/LanguageModel.svelte";
  import Settings from "./lib/Pages/Settings.svelte";
  import Summarizer from "./lib/Pages/Summarizer.svelte";
  import Writer from "./lib/Pages/Writer.svelte";
  import Rewriter from "./lib/Pages/Rewriter.svelte";
  import Translator from "./lib/Pages/Translator.svelte";

  const tabs = ['home', 'lm', 'summarizer', 'detector', 'translate', 'writer', 'rewriter', 'settings'];
</script>

<main>
  {#if process.env.NODE_ENV === 'development' && false}
    <div>{JSON.stringify($generalSettings)}</div>
    <div>{JSON.stringify($inputs)}</div>
    <div>{JSON.stringify($settings)}</div>
  {/if}
  <div class="tab-container">
      <div class="tab-buttons">
          {#each tabs as tab (tab)}
              <button class="tab-button" on:click={() => { $activeTab = tab }}>{tab}</button>
          {/each}
      </div>
      <div class="tab-content">
          {#if $activeTab === 'home'}
              <Home/>
          {:else if $activeTab === 'lm'}
              <LanguageModel/>
          {:else if $activeTab === 'summarizer'}
              <Summarizer/>
          {:else if $activeTab === 'detector'}
              <LanguageDetector/>
          {:else if $activeTab === 'translate'}
              <Translator/>
          {:else if $activeTab === 'writer'}
              <Writer/>
          {:else if $activeTab === 'rewriter'}
              <Rewriter/>
          {:else if $activeTab === 'settings'}
              <Settings/>
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

  --primary-color: #242424;
  --secondary-color: #f1f1f1;

  color-scheme: light dark;
  color: var(--secondary-color);
  background-color: var(--primary-color);

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (prefers-color-scheme: light) {
  :root {
    --primary-color: #f1f1f1;
    --secondary-color: #242424;
  }
}

.tab-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.tab-buttons {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  background-color: #f1f1f1;
  padding: 0px;
}

.tab-button {
  background-color: #e7e7e7;
  border: none;
  padding: 10px;
  cursor: pointer;
  text-transform: uppercase;
}

.tab-button:hover {
  background-color: #ddd;
}

.tab-content {
  flex-grow: 1;
  background: #f1f1f1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
