<template>
  <page>
    <template slot="title">
      {{ $t('Mining.Mining') }}
    </template>
    <template slot="body">
      <button v-if="mining" class="button" @click="stop">{{ $t('Mining.Stop') }}</button>
      <template v-else>
        <b-field label="API" :message="$t('Mining.ApiMessage')">
          <b-select v-model="api">
            <option value="opencl">OpenCL</option>
            <option value="cuda">CUDA</option>
            <option value="cuda-opencl">{{ $t('Mining.Both') }}</option>
          </b-select>
        </b-field>
        <b-field :label="$t('Mining.Pool')" :message="$t('Mining.PoolMessage')">
          <b-input v-model="pool" placeholder="scheme://user[.workername][:password]@hostname:port[/...]"></b-input>
        </b-field>
        <button class="button" @click="start">{{ $t('Mining.Start') }}</button>
      </template>
      <progress-bar v-if="downloading" size="tiny" :val="transferred" :max="total" bar-transition="none" />
      <code v-html="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import setTitle from '../../../lib/setTitle'
  import os from 'os'
  import fs from 'fs'
  import path from 'path'
  import { spawn } from 'child_process'
  import download from 'download'
  import ProgressBar from 'vue-simple-progress'
  import { remote } from 'electron'

  let ethminerPath = path.join(remote.app.getPath('userData'), 'ethminer', 'bin', (os.platform() === 'win32') ? 'ethminer.exe' : 'ethminer')
  let ethminerProcess

  let urls = {
    linux: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-linux-x86_64.tar.gz',
    darwin: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-darwin-x86_64.tar.gz',
    win32: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-cuda10.0-windows-amd64.zip',
  }

  export default {
    name: 'mining',
    components: {
      Page,
      ProgressBar,
    },
    data() {
      return {
        mining: false,
        api: 'opencl',
        pool: '',
        downloading: false,
        transferred: 0,
        total: 0,
        output: '',
      }
    },
    async created() {
      setTitle(this.$t('mining'))

      try {
        fs.statSync(ethminerPath)
      }
      catch (e) {
      let url = urls[os.platform()]
      await download(url, path.join(remote.app.getPath('userData'), 'ethminer'), {extract: true})
        .on('downloadProgress', progress => {
          this.downloading = true
          this.transferred = progress.transferred
          this.total = progress.total
        })
        this.downloading = false
      }

      if (ethminerProcess && !ethminerProcess.killed) {
        this.mining = true
        this.attach()
      }
      else {
        let args = [
      		'--list-devices',
          '--cuda-opencl',
          '--nocolor',
          '--syslog',
      	]

      	let process = spawn(ethminerPath, args)

      	process.on('error', err => {
          this.output += '<span style="color: red;">' + err + '</span>'
        })
        process.on('exit', (code, signal) => {
          if (signal) {
            this.output += '<span style="color: red;">' + signal + '</span>'
          }
        })
      	process.stdout.on('data', data => {
          this.output += data.toString()
        })
      	process.stderr.on('data', data => {
          this.output += data.toString()
        })
      }
    },
    destroyed() {
      if (ethminerProcess) {
        ethminerProcess.removeAllListeners('error')
        ethminerProcess.removeAllListeners('exit')
        ethminerProcess.stdout.removeAllListeners('data')
        ethminerProcess.stderr.removeAllListeners('data')
      }
    },
    methods: {
      async start(event) {
        this.output = ''

        let args = [
          '--nocolor',
      		'--' + this.api,
          '--pool',
      	]

        if (this.pool == '') {
          args.push('stratum+tcp://127.0.0.1:8008')
          await this.$mixClient.parityApi.parity.setAuthor(this.$activeAccount.get().controllerAddress)
        }
        else {
          args.push(this.pool)
        }

        this.mining = true
        ethminerProcess = spawn(ethminerPath, args)
        this.attach()
      },
      stop(event) {
        ethminerProcess.kill()
      },
      attach() {
        ethminerProcess.on('error', err => {
          this.output += '<span style="color: red;">' + err + '</span>'
          this.detach()
        })
        ethminerProcess.on('exit', (code, signal) => {
          if (signal) {
            this.output += '<span style="color: red;">' + signal + '</span>'
          }
          this.detach()
        })
        ethminerProcess.stdout.on('data', data => {
          this.output += data.toString()
        })
        ethminerProcess.stderr.on('data', data => {
          this.output += data.toString()
        })
      },
      detach() {
        if (this.pool == '') {
          // Removing pending 5 MIX.
          this.$mixClient.parityApi.parity.setAuthor('0x0000000000000000000000000000000000000000')
        }
        ethminerProcess.removeAllListeners('error')
        ethminerProcess.removeAllListeners('exit')
        ethminerProcess.stdout.removeAllListeners('data')
        ethminerProcess.stderr.removeAllListeners('data')
        ethminerProcess = null
        this.mining = false
      },
    },
  }
</script>
