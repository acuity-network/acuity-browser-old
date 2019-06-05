<template>
  <page>
    <template slot="title">
      Mining
    </template>
    <template slot="body">
      <code v-html="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script>
  import os from 'os'
  import path from 'path'
  import { spawn } from 'child_process'
  import { remote } from 'electron'
  import Page from './Page.vue'

  export default {
    name: 'mining',
    components: {
      Page,
    },
    data() {
      return {
        output: '',
      }
    },
    created() {
      let isWindows = os.platform() === 'win32'
    	let ethminerPath

    	if (process.env.NODE_ENV !== 'development') {
    		ethminerPath = path.join(remote.app.getAppPath(), '..')
    	}
    	else {
    		ethminerPath = path.join(remote.app.getAppPath(), '..', '..', '..', '..', '..', 'src')
    	}

    	ethminerPath = path.join(ethminerPath, 'extraResources', 'ethminer', 'bin', isWindows ? 'ethminer.exe' : 'ethminer')
    	console.log('Ethminer path: ' + ethminerPath)

      let args = [
    		'--list-devices',
        '--cuda-opencl',
        '--nocolor',
        '--syslog',
    	]

    	let ethminerProcess = spawn(ethminerPath, args)

    	ethminerProcess.on('error', err => {
        this.output += '<span style="color: red;">' + err + '</span>'
      })
      ethminerProcess.on('exit', (code, signal) => {
        if (signal) {
          this.output += '<span style="color: red;">Exit signal: ' + signal + '</span>'
        }
      })
    	ethminerProcess.stdout.on('data', data => {
        this.output += data.toString()
      })
    	ethminerProcess.stderr.on('data', data => {
        this.output += '<span style="color: red;">' + data.toString() + '</span>'
      })
    },
  }
</script>
