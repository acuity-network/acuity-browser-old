<template>
  <page>
    <template slot="title">
      {{ $t('ManageAccountDelete.DeleteAccount') }}
    </template>

    <template slot="body">
      <b-message type="is-warning">
        {{ $t('ManageAccountDelete.Warning') }}
      </b-message>
      <b-field :label="$t('ManageAccountDelete.ControllerAddress')">
        <code>{{ controllerAddress }}</code>
      </b-field>
      <b-field :label="$t('ManageAccountDelete.ContractAddress')">
        <code>{{ contractAddress }}</code>
      </b-field>
      <b-field :label="$t('ManageAccountDelete.Profile')">
        <profile-link :address="contractAddress"></profile-link>
      </b-field>
      <button class="button" @click="clickDelete">{{ $t('ManageAccountDelete.Delete') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import ProfileLink from '../ProfileLink.vue'
  import MixAccount from '../../../lib/MixAccount'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'manage-account-delete',
    props: ['controllerAddress'],
    components: {
      Page,
      ProfileLink,
    },
    data() {
      return {
        contractAddress: '',
        profileName: '',
      }
    },
    methods: {
      async clickDelete() {
        // Delete account from database.
        await this.$db.batch()
        .del('/account/controllerAddress/' + this.controllerAddress)
        .del('/account/controller/' + this.controllerAddress + '/contract')
        .del('/account/contract/' + this.contractAddress + '/controller')
        .del('/account/controller/' + this.controllerAddress + '/keyObject')
        .write()
        this.$router.push({ name: 'manage-accounts' })
      }
    },
    async created() {
      setTitle(this.$t('ManageAccountDelete.DeleteAccount'))
      try {
        let account: MixAccount = await new MixAccount(this, this.controllerAddress).init()
        this.contractAddress = account.contractAddress
      }
      catch(e) {}
    },
  }
</script>
