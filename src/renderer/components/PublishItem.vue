<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <h1 class="title">Publish Item</h1>
        </div>
      </section>

      <section class="section">
        <ul>
          <li><router-link to="/publish-item/mixin-type">Publish Mixin Type</router-link></li>
          <li><router-link to="/publish-item/image">Publish Image</router-link></li>
          <li><router-link to="/publish-item/feed-personal">Publish Personal Feed</router-link></li>
          <li><router-link to="/publish-item/feed-topic">Publish Topic Feed</router-link></li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'create-item',
    components: {},
    methods: {}
  }
</script>

<style>

  body, button {
    font-family: 'OpenSans', 'sans-serif';
  }

  button {
    font-weight: bold;
  }

</style>
