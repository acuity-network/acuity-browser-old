<template>
  <page>
    <template slot="title">
      Publish Item
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/publish-item/mixin-type">Publish Mixin Type</router-link></li>
        <li><router-link to="/publish-item/image">Publish Image</router-link></li>
        <li><router-link to="/publish-item/feed-personal">Publish Personal Feed</router-link></li>
        <li><router-link to="/publish-item/feed-topic">Publish Topic Feed</router-link></li>
      </ul>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

  export default {
    name: 'create-item',
    components: {
      Page,
    },
    methods: {}
  }
</script>

<style>

  button {
    font-weight: bold;
  }

</style>
