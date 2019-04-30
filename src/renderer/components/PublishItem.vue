<template>
  <page>
    <template slot="title">
      {{ $t('publishItem') }}
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/publish-item/mixin-type">{{ $t('publishMixin') }}</router-link></li>
        <li><router-link to="/publish-item/image">{{ $t('publishImage') }}</router-link></li>
        <li><router-link to="/publish-item/feed">{{ $t('publishFeed') }}</router-link></li>
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
