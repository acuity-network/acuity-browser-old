<template>
  <page>
    <template slot="title">
      {{ $t('Settings.Settings') }}
    </template>

    <template slot="body">
      <b-field :label="$t('Settings.Language')">
        <b-select v-model="locale">
          <option value="en-US">English (United States)</option>
          <option value="ru">русский</option>
          <option value="th">ไทย</option>
        </b-select>
      </b-field>
      <b-field  v-if="isWeb" label="MIX Blockchain endpoint">
        <b-select v-model="mixEndpoint">
          <option value="atlanta">Atlanta, GA</option>
          <option value="dallas">Dallas, TX</option>
          <option value="frankfurt">Frankfurt</option>
          <option value="freemont">Freemont, CA</option>
          <option value="london">London</option>
          <option value="newark">Newark, NJ</option>
          <option value="singapore">Singapore</option>
          <option value="tokyo">Tokyo</option>
          <option value="toronto">Toronto</option>
        </b-select>
      </b-field>
      <b-field :label="$t('Settings.Advanced')">
        <b-checkbox v-model="development">
          {{ $t('Settings.DevelopmentMode') }}
        </b-checkbox>
      </b-field>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'settings',
    components: {
      Page,
    },
    data() {
      return {
        isWeb: !this.$isDesktop,
        locale: this.$settings.get('locale'),
        mixEndpoint: this.$settings.get('mixEndpoint'),
        development: this.$settings.get('development'),
      }
    },
    watch: {
      locale() {
        this.$settings.set('locale', this.locale)
        this.$root.$i18n.locale = this.locale
      },
      mixEndpoint() {
        this.$settings.set('mixEndpoint', this.mixEndpoint)
        this.$mixClient.init(this.$root, this.mixEndpoint)
      },
      development() {
        this.$settings.set('development', this.development)
        this.$root.$emit('development', this.development)
      },
    },
    created() {
      setTitle(this.$t('Settings.Settings'))
    },
  }
</script>
