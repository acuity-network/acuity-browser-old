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
		this.itemDagMixins = new this.web3.eth.Contract(require('./contracts/MixItemDagOneParent.abi.json'), '0x341518c5b28d3564b39ab7560e47b4486ddb762a')
		this.itemDagComments = new this.web3.eth.Contract(require('./contracts/MixItemDagOneParent.abi.json'), '0x2a37382ea172d0a28905052ee79f802cd7fd74b4')
		this.itemDagFeedItems = new this.web3.eth.Contract(require('./contracts/MixItemDagOnlyOwner.abi.json'), '0x622d9bd5adf631c6e190f8d2beebcd5533ffa5e6')
		this.itemTopics = new this.web3.eth.Contract(require('./contracts/MixItemTopics.abi.json'), '0xcc64d1519d4e2be2b025204f5b3470d5f14a1a99')
		this.accountRegistry = new this.web3.eth.Contract(require('./contracts/MixAccountRegistry.abi.json'), '0xbcab5026b4d79396b222abc4d1ca36db10984c73')
		this.accountProfile = new this.web3.eth.Contract(require('./contracts/MixAccountProfile.abi.json'), '0x994abe0212b5dcc1fb0b0e7336e7980316c3fe19')
		this.accountFeeds = new this.web3.eth.Contract(require('./contracts/MixAccountItems.abi.json'), '0xc9ba9507d9f5be1d13ff2dca6f7e43dbfa859645')
		this.accountTokens = new this.web3.eth.Contract(require('./contracts/MixAccountItems2.abi.json'), '0xa2f0d67eb4e6e33d568f25ce9cb8226e9032e9d1')
		this.trustedAccounts = new this.web3.eth.Contract(require('./contracts/MixTrustedAccounts.abi.json'), '0x70e2e2d6b31cd25e00c034ac9cfc79575efa26a9')
		this.reactions = new this.web3.eth.Contract(require('./contracts/MixReactions.abi.json'), '0xd7051cd496a3a8373f9cf89476c04a7d51a5cc88')
		this.tokenRegistryAddress = '0x5402efb80b307250b978cb1039a95e0c292b50c2'
		this.tokenRegistry = new this.web3.eth.Contract(require('./contracts/MixTokenRegistry.abi.json'), this.tokenRegistryAddress)
		this.uniswapFactory = new this.web3.eth.Contract(require('./contracts/UniswapFactory.abi.json'), '0x1381a70fc605b7d7e54b7e1159afba1429a4bbb1')

		// Emit sync info.
		let startingBlock, currentBlock
		let newBlockHeaders = throttle(async () => {
			let isSyncing = await this.web3.eth.isSyncing()

			if (isSyncing !== false) {
				if (isSyncing.currentBlock != currentBlock) {
					currentBlock = isSyncing.currentBlock

					if (!startingBlock) {
						startingBlock = currentBlock
					}

					isSyncing.startingBlock = startingBlock
					vue.$emit('mix-client-syncing', isSyncing)
				}
			}
		}, 100, true)

		let newBlockHeadersEmitter = this.web3.eth.subscribe('newBlockHeaders')
		.on('data', newBlockHeaders)

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
