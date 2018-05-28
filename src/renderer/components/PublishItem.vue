<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Publish item</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <ul>
            <li><router-link to="/publish-item/mixin-type">Publish Mixin type</router-link></li>
            <li><router-link to="/publish-item/image">Publish Image</router-link></li>
          </ul>
        </div>
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
