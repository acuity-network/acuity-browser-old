<template>
  <div id="wrapper">
    <main>
      <section class="section is-primary">
        <h1 class="title is-spaced"><slot name="title"></slot></h1>
        <h2 class="subtitle"><slot name="subtitle"></slot></h2>
      </section>

      <section class="section">
        <slot name="body"></slot>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'page',
  }
</script>

<style scoped>
  .section {
    padding: 0 1.5rem;
    margin: 1.5rem 0;
  }

  section.is-primary {
    font-family: "Montserrat";
    margin: 3rem 0;
  }

  .title {
    font-weight: bold;
    margin-bottom: 0;
  }
</style>
