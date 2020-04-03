<template>
	<div class="wavefrontscontain">
		<img src="../assets/acuity-logo.svg" class="acuitylogo">
		<div class="status">{{ status }}</div>
		<progress-bar size="tiny" :val="syncProgress" :max="syncTotal" bar-transition="none" />
		<div class="status"><br />
			<span :class="web3Class">Web3 API</span><br />
			<span :class="syncClass">{{ $t('Splash.BlockchainSync') }}</span><br />
			<span :class="stateClass">{{ $t('Splash.BlockchainState') }}</span><br />
			<span :class="ipfsApiClass">IPFS API</span><br />
			<span :class="ipfsGatewayClass">{{ $t('Splash.IpfsGateway') }}</span>
		</div>
  </div>
</template>

<script lang="ts">
	let ProgressBar: any = require('vue-simple-progress')

  export default {
    name: 'splash',
		components: {
      ProgressBar,
    },
    data() {
      return {
        syncTotal: 1,
        syncProgress: 0,
				status: this.$t('Splash.PleaseWait'),
				web3Class: '',
				syncClass: '',
				stateClass: '',
				ipfsApiClass: '',
				ipfsGatewayClass: '',
      }
    },
		async created() {
      this.$root.$on('mix-client-syncing', (isSyncing: any) => {
				this.status = this.$t('Splash.Block') + ' ' + isSyncing.currentBlock.toLocaleString()
				this.syncTotal = isSyncing.highestBlock - isSyncing.startingBlock
				this.syncProgress = isSyncing.currentBlock - isSyncing.startingBlock
      })

			this.$root.$on('mix-client-web3', () => {
				this.web3Class = 'completed'
      })

			this.$root.$on('mix-client-sync', () => {
				this.syncClass = 'completed'
      })

			this.$root.$on('mix-client-state', () => {
				this.stateClass = 'completed'
      })

			this.$root.$on('ipfs-api', () => {
				this.ipfsApiClass = 'completed'
      })

			this.$root.$on('ipfs-gateway', () => {
				this.ipfsGatewayClass = 'completed'
      })

    }
	}
</script>

<style>
	.wavefrontscontain {
/*	  background-image: url('../assets/splash-background.webp');
	  background-position: 50% 50%;
	  background-size: cover;
	  background-repeat: no-repeat;
	  background-attachment: fixed;
*/
		background-color: #121212;
	  position: fixed;
	  left: 0%;
	  top: 0%;
	  right: 0%;
	  bottom: 0%;
	  width: 100vw;
	  height: 100vh;
	}

	.acuitylogo {
		display: block;
		width: 200px;
		margin: 60px auto;
		z-index: 1;
	}

	.vue-simple-progress {
		display: block;
		width: 400px;
		margin: 0 auto;
		z-index: 1;
	}

	.status {
		display: block;
		width: 400px;
		margin: 0 auto;
		z-index: 1;
	}

	.completed {
		font-weight: bold;
	}

	.br-c6 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -950px;
	  bottom: -950px;

	  overflow: hidden;
	  width: 1900px;
	  height: 1900px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.br-c5 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -800px;
	  bottom: -800px;

	  overflow: hidden;
	  width: 1600px;
	  height: 1600px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.br-c4 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -650px;
	  bottom: -650px;

	  overflow: hidden;
	  width: 1300px;
	  height: 1300px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.br-c3 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -500px;
	  bottom: -500px;

	  overflow: hidden;
	  width: 1000px;
	  height: 1000px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.br-c2 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -350px;
	  bottom: -350px;

	  overflow: hidden;
	  width: 700px;
	  height: 700px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.br-c1 {
	  position: absolute;
	  left: auto;
	  top: auto;
	  right: -200px;
	  bottom: -200px;

	  overflow: hidden;
	  width: 400px;
	  height: 400px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c6 {
	  position: absolute;
	  left: -950px;
	  top: auto;
	  bottom: -950px;

	  overflow: hidden;
	  width: 1900px;
	  height: 1900px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c5 {
	  position: absolute;
	  left: -800px;
	  top: auto;
	  bottom: -800px;

	  overflow: hidden;
	  width: 1600px;
	  height: 1600px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c4 {
	  position: absolute;
	  left: -650px;
	  top: auto;
	  bottom: -650px;

	  overflow: hidden;
	  width: 1300px;
	  height: 1300px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c3 {
	  position: absolute;
	  left: -500px;
	  top: auto;
	  bottom: -500px;

	  overflow: hidden;
	  width: 1000px;
	  height: 1000px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c2 {
	  position: absolute;
	  left: -350px;
	  top: auto;
	  bottom: -350px;

	  overflow: hidden;
	  width: 700px;
	  height: 700px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.bl-c1 {
	  position: absolute;
	  left: -200px;
	  top: auto;
	  bottom: -200px;

	  overflow: hidden;
	  width: 400px;
	  height: 400px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c1 {
	  position: absolute;
	  left: -200px;
	  top: -200px;
	  	  overflow: hidden;
	  width: 400px;
	  height: 400px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c2 {
	  position: absolute;
	  left: -350px;
	  top: -350px;
	  	  overflow: hidden;
	  width: 700px;
	  height: 700px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c4 {
	  position: absolute;
	  left: -650px;
	  top: -650px;
	  	  overflow: hidden;
	  width: 1300px;
	  height: 1300px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c3 {
	  position: absolute;
	  left: -500px;
	  top: -500px;
	  	  overflow: hidden;
	  width: 1000px;
	  height: 1000px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c5 {
	  position: absolute;
	  left: -800px;
	  top: -800px;
	  	  overflow: hidden;
	  width: 1600px;
	  height: 1600px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tl-c6 {
	  position: absolute;
	  left: -950px;
	  top: -950px;
	  	  overflow: hidden;
	  width: 1900px;
	  height: 1900px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c1 {
	  position: absolute;
	  top: -200px;
	  right: -200px;
	  	  overflow: hidden;
	  width: 400px;
	  height: 400px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c2 {
	  position: absolute;
	  top: -350px;
	  right: -350px;
	  	  overflow: hidden;
	  width: 700px;
	  height: 700px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c3 {
	  position: absolute;
	  top: -500px;
	  right: -500px;
	  	  overflow: hidden;
	  width: 1000px;
	  height: 1000px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c5 {
	  position: absolute;
	  top: -800px;
	  right: -800px;
	  	  overflow: hidden;
	  width: 1600px;
	  height: 1600px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c4 {
	  position: absolute;
	  top: -650px;
	  right: -650px;
	  	  overflow: hidden;
	  width: 1300px;
	  height: 1300px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}

	.tr-c6 {
	  position: absolute;
	  top: -950px;
	  right: -950px;
	  	  overflow: hidden;
	  width: 1900px;
	  height: 1900px;
	  -webkit-box-pack: center;
	  -webkit-justify-content: center;
	  -ms-flex-pack: center;
	  justify-content: center;
	  -webkit-box-align: center;
	  -webkit-align-items: center;
	  -ms-flex-align: center;
	  align-items: center;
	  border-style: solid;
	  border-width: 1px;
	  border-color: #bfbfbf;
	  border-radius: 99999px;
	  opacity: 0.1;
	}
</style>
