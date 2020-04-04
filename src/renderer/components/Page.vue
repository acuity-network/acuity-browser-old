<template>
  <main>
    <section class="section is-primary">
      <h1 class="title is-spaced"><slot name="title"></slot></h1>
      <h2 class="subtitle"><slot name="subtitle"></slot></h2>
    </section>

    <section class="section">
      <slot name="messages"></slot>
    </section>

    <section class="section">
      <slot name="body"></slot>
    </section>
  </main>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    name: 'page',
  })
</script>

<style scoped>
  .section {
    padding: 0;
    margin-bottom: 1.5rem;
  }

  h1.title {
    font-family: "Noto Serif", serif;
    font-weight: bold;
    margin-bottom: 0;
  }
</style>
