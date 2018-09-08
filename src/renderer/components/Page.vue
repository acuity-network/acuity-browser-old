<template>
  <div id="wrapper">
    <main>
      <section class="section is-primary">
        <h1 class="title"><slot name="title"></slot></h1>
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
