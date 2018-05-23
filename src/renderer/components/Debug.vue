<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Debug</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-field label="itemId">
            <b-input id="itemId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
          </b-field>

          <button class="button is-primary" v-on:click="read">Read item</button>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <code id="output" style="display: block; white-space: pre;"></code>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'debug',
    components: {},
    methods: {
      read: function (event) {
        const output = document.getElementById('output')
        output.innerHTML = '';
        const itemId = document.getElementById('itemId').value

        const Web3 = require('web3')
        const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8645'))

        const itemStoreRegistryAbi = require('./ItemStoreRegistry.abi.json')
        const itemStoreRegistry = new web3.eth.Contract(itemStoreRegistryAbi, '0xa46adddd3105715fa0ea0d4a883d4be99452c3f6')

        itemStoreRegistry.methods.getItemStore(itemId).call().then(function(itemStoreAddress) {
          output.appendChild(document.createTextNode('itemStoreAddress: '  + itemStoreAddress + '\n'))

          const itemStoreAbi = require('./ItemStoreInterface.abi.json')
          const itemStore = new web3.eth.Contract(itemStoreAbi, itemStoreAddress)

          itemStore.methods.getInUse(itemId).call().then(function(inUse) {
            if (!inUse) {
              output.append('Item not found.\n')
              return;
            }

            itemStore.methods.getContractId().call().then(function(contractId) {
              if (contractId != "0x2d54bddf4be19c6c") {
                output.append('Unknown item store.\n')
                return;
              }
              output.append('itemStore: ItemStoreIpfsSha256\n')

              const itemStoreIpfsSha256Abi = require('./ItemStoreIpfsSha256.abi.json')
              const itemStoreIpfsSha256 = new web3.eth.Contract(itemStoreIpfsSha256Abi, itemStoreAddress)

              itemStoreIpfsSha256.methods.getItem(itemId).call().then(function(item) {
                output.append("Updatable: " + ((item.flags & 0x01) ? 'true' : 'false') + '\n')
                output.append("Enforce revisions: " + ((item.flags & 0x02) ? 'true' : "false") + '\n')
                output.append("Retractable: " + ((item.flags & 0x04) ? 'true' : 'false') + '\n')
                output.append("Transferable: " + ((item.flags & 0x08) ? 'true' : 'false') + '\n')
                output.append("Owner: " + item.owner + '\n')
                output.append("Revision count: " + item.revisionCount + '\n')
                output.append("Parent count: " + item.parentIds.length + '\n')
                output.append("Child count: " + item.childIds.length + '\n')
              })
            })
          })
        })
      }
    }
  }
</script>
