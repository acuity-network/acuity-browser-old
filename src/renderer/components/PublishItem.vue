<template>
  <page>
    <template slot="title">
      {{ $t('PublishItem.PublishItem') }}
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/publish-item/image">{{ $t('PublishItem.PublishImage') }}</router-link></li>
        <li><router-link to="/publish-item/feed">{{ $t('PublishItem.PublishFeed') }}</router-link></li>
        <li v-show="false"><router-link to="/publish-item/file">{{ $t('PublishItem.PublishFile') }}</router-link></li>
        <li v-if="isDevelopment"><router-link to="/publish-item/mixin-type">{{ $t('PublishItem.PublishMixinType') }}</router-link></li>
      </ul>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle'

  export default {
    name: 'create-item',
    components: {
      Page,
    },
    data() {
      return {
        isDevelopment: this.$settings.get('development'),
      }
    },
    created() {
      setTitle(this.$t('PublishItem.PublishItem'))
    },
  }
</script>
