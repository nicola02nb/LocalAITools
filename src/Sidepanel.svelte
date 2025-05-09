<script lang="ts">
  import { activeTab, inputs, settings, generalSettings } from "./lib/Pages/shared";
  import Home from "./lib/Pages/Home.svelte";
  import LanguageDetector from "./lib/Pages/LanguageDetector.svelte";
  import LanguageModel from "./lib/Pages/LanguageModel.svelte";
  import Settings from "./lib/Pages/Settings.svelte";
  import Summarizer from "./lib/Pages/Summarizer.svelte";
  import Writer from "./lib/Pages/Writer.svelte";
  import Rewriter from "./lib/Pages/Rewriter.svelte";
  import Translate from "./lib/Pages/Translate.svelte";

  const tabs = ['home', 'lm', 'summarizer', 'detector', 'translate', 'writer', 'rewriter', 'settings'];
</script>

<main>
  {#if process.env.NODE_ENV === 'development'}
    <div>{JSON.stringify($generalSettings)}</div>
    <div>{JSON.stringify($inputs)}</div>
    <div>{JSON.stringify($settings)}</div>
  {/if}
  <div class="tab-container">
      <div class="tab-buttons">
          {#each tabs as tab}
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
              <Translate/>
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

* {
  font-family: 'League Spartan', sans-serif;
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
