<template>
  <page>
    <template slot="title">
      {{ $t('settings') }}
    </template>

    <template slot="body">
      <b-field :label="$t('language')">
        <b-select v-model="locale">
          <option value="en">English - en</option>
          <option value="ru">Russian - ru</option>
        </b-select>
      </b-field>
      <b-field label="Max File Pin Size (MB)">
        <b-numberinput rounded v-model="maxFilePinSize"></b-numberinput>
      </b-field>
      <b-field label="Advanced">
        <b-checkbox v-model="development">
          Development mode
        </b-checkbox>
      </b-field>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import i18n from '../plugins/i18n'
  export default {
    name: 'settings',
    components: {
      Page,
    },
    data() {
      return {
        locale: this.$settings.get('locale'),
        development: this.$settings.get('development'),
        maxFilePinSize: this.$settings.get('maxFilePinSize')/1000000
      }
    },
    watch: {
      locale() {
        i18n.locale = this.locale;
        this.$settings.set('locale', this.locale);
      },
      development() {
        this.$settings.set('development', this.development);
      },
      maxFilePinSize() {
        this.$settings.set('maxFilePinSize', Math.round(this.maxFilePinSize) * 1000000)
      }
    },
  }
</script>
