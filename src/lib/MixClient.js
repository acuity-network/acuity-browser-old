import Web3 from 'web3'
import net from 'net'
import os from 'os'
import path from 'path'
import { remote } from 'electron'
import Api from '@parity/api'
import throttle from 'just-throttle'

export default class MixClient {

	async init(vue) {
		let ipcPath

		if (os.platform() === 'win32') {
		  ipcPath = '\\\\.\\pipe\\mix.ipc'
		}
		else {
		  ipcPath = path.join(remote.app.getPath('userData'), 'parity.ipc')
		}

		// Wait for IPC to come up.
		await new Promise((resolve, reject) => {
			let intervalId = setInterval(async () => {
				try {
					this.web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net))
					await this.web3.eth.getProtocolVersion()
					clearInterval(intervalId)
					resolve()
				}
				catch (e) {}
			}, 50)
		})

		vue.$emit('mix-client-web3')

		this.web3.eth.defaultBlock = 'pending'
		this.web3.eth.transactionConfirmationBlocks = 1

		this.parityApi = new Api(new Api.Provider.Http('http://localhost:8645'))

		this.itemStoreRegistry = new this.web3.eth.Contract(require('./contracts/MixItemStoreRegistry.abi.json'), '0xb7aead157809d83234ae1a9ac42d8846ebceba6e')
		this.itemStoreIpfsSha256 = new this.web3.eth.Contract(require('./contracts/MixItemStoreIpfsSha256.abi.json'), '0x26b10bb026700148962c4a948b08ae162d18c0af')
		this.itemStoreShortId = new this.web3.eth.Contract(require('./contracts/MixItemStoreShortId.abi.json'), '0xf40f0ae20067f5095e2b5fe1c21da8b8e61d3cac')
		this.itemDagMixins = new this.web3.eth.Contract(require('./contracts/MixItemDagOneParent.abi.json'), '0x964a1958124542ae4fc4e1513c70687e36e92587')
		this.itemDagComments = new this.web3.eth.Contract(require('./contracts/MixItemDagOneParent.abi.json'), '0x4aede30fd28df8aa06e1e03ba5a1b0e85a3cfef2')
		this.itemDagFeedItems = new this.web3.eth.Contract(require('./contracts/MixItemDagOnlyOwner.abi.json'), '0xa9a5c68af9cee27812d9f1379d03e27f9ef449d7')
		this.accountRegistry = new this.web3.eth.Contract(require('./contracts/MixAccountRegistry.abi.json'), '0xbcab5026b4d79396b222abc4d1ca36db10984c73')
		this.accountProfile = new this.web3.eth.Contract(require('./contracts/MixAccountProfile.abi.json'), '0xa8d128ed120e4ad715e445ec4829052f1935a011')
		this.accountFeeds = new this.web3.eth.Contract(require('./contracts/MixAccountItems.abi.json'), '0x240433a3e6d9ba4ea8853629238cd03e5a4f479c')
		this.trustedAccounts = new this.web3.eth.Contract(require('./contracts/MixTrustedAccounts.abi.json'), '0x70e2e2d6b31cd25e00c034ac9cfc79575efa26a9')
		this.reactions = new this.web3.eth.Contract(require('./contracts/MixReactions.abi.json'), '0xf313bfdee4e952237fd0239f55c23ec8038e246b')
		this.tokenRegistryAddress = '0x71387fc1fc8238cb80d3ca3d67d07bb672a3a8d8'
		this.tokenRegistry = new this.web3.eth.Contract(require('./contracts/MixTokenRegistry.abi.json'), this.tokenRegistryAddress)

		// Emit sync info.
		let startingBlock, currentBlock
		let emitSyncing = throttle(status => vue.$emit('mix-client-syncing', status), 250, true)
		let newBlockHeadersEmitter = this.web3.eth.subscribe('newBlockHeaders')
		.on('data', async () => {
			let isSyncing = await this.web3.eth.isSyncing()

			if (isSyncing !== false) {
				if (isSyncing.currentBlock != currentBlock) {
					currentBlock = isSyncing.currentBlock

					if (!startingBlock) {
						startingBlock = currentBlock
					}

					isSyncing.startingBlock = startingBlock
					emitSyncing(isSyncing)
				}
			}
		})

		// Wait for Parity to sync.
		await new Promise((resolve, reject) => {
			let intervalId = setInterval(async () => {
				let isSyncing = await this.web3.eth.isSyncing()

				if (isSyncing === false) {
					vue.$emit('mix-client-sync')
					clearInterval(intervalId)
					resolve()
				}
			}, 100);
		})

		// Wait for Parity to start working.
		return new Promise((resolve, reject) => {
			let intervalId = setInterval(async () => {
				try {
					await this.itemStoreIpfsSha256.methods.getItem('0x7c8239285dc6053f835f70d5dc1f2979da95f6e4484d04dff1b5847865d2094d').call()
					vue.$emit('mix-client-state')
					clearInterval(intervalId)
					resolve()
				}
				catch (e) {}
			}, 100);
		})
	}
}
