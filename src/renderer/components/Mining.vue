<template>
  <page>
    <template slot="title">
      {{ $t('mining') }}
    </template>
    <template slot="body">
      <template v-if="mining">
        <button class="button" @click="stop">{{ $t('stop') }}</button>
      </template>
      <template v-else>
        <b-field label="API" message="AMD devices use OpenCL. Nvidia devices use CUDA.">
          <b-select v-model="api">
            <option value="opencl">OpenCL</option>
            <option value="cuda">CUDA</option>
            <option value="cuda-opencl">Both</option>
          </b-select>
        </b-field>
        <b-field label="Pool" message="Leave blank for solo mining.">
          <b-input v-model="pool" placeholder="scheme://user[.workername][:password]@hostname:port[/...]"></b-input>
        </b-field>
        <button class="button" @click="start">{{ $t('start') }}</button>
      </template>
      <code v-html="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle.js'
  import os from 'os'
  import path from 'path'
  import { spawn } from 'child_process'
  import { remote } from 'electron'

  let ethminerPath

  if (process.env.NODE_ENV !== 'development') {
  	ethminerPath = path.join(remote.app.getAppPath(), '..')
  }
  else {
  	ethminerPath = path.join(remote.app.getAppPath(), '..', '..', '..', '..', '..', 'src')
  }

  ethminerPath = path.join(ethminerPath, 'extraResources', 'ethminer', 'bin', (os.platform() === 'win32') ? 'ethminer.exe' : 'ethminer')
  let ethminerProcess

  export default {
    name: 'mining',
    components: {
      Page,
    },
    data() {
      return {
        mining: false,
        api: 'opencl',
        pool: '',
        output: '',
      }
    },
    created() {
      setTitle(this.$t('mining'))

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
        await this.$mixClient.parityApi.parity.setAuthor(window.activeAccount.controllerAddress)

        let args = [
          '--nocolor',
      		'--' + this.api,
          '--pool',
          (this.pool == '') ? 'stratum+tcp://127.0.0.1:8008' : this.pool,
      	]

        ethminerProcess = spawn(ethminerPath, args)
        this.mining = true
        this.attach()
      },
      stop(event) {
        ethminerProcess.removeAllListeners('error')
        ethminerProcess.removeAllListeners('exit')
        ethminerProcess.stdout.removeAllListeners('data')
        ethminerProcess.stderr.removeAllListeners('data')
        ethminerProcess.kill()
        ethminerProcess = null
        this.mining = false
      },
      attach() {
        ethminerProcess.on('error', err => {
          this.output += '<span style="color: red;">' + err + '</span>'
          this.mining = false
          ethminerProcess = null
        })
        ethminerProcess.on('exit', (code, signal) => {
          if (signal) {
            this.output += '<span style="color: red;">' + signal + '</span>'
          }
          this.mining = false
          ethminerProcess = null
        })
        ethminerProcess.stdout.on('data', data => {
          this.output += data.toString()
        })
        ethminerProcess.stderr.on('data', data => {
          this.output += data.toString()
        })
      },
    },
  }
</script>
