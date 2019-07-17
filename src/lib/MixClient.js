import Web3 from 'web3'
import net from 'net'
import os from 'os'
import path from 'path'
import { remote } from 'electron'
import Api from '@parity/api';

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

		this.itemStoreRegistry = new this.web3.eth.Contract(require('./contracts/ItemStoreRegistry.abi.json'), '0x711dc8d9ce92baffb95e6fe56755ef68d80112d8')
		this.itemStoreIpfsSha256 = new this.web3.eth.Contract(require('./contracts/ItemStoreIpfsSha256.abi.json'), '0x1d1f9c6086a9150abaf4fb98c3e65ca96eb275f6')
		this.itemStoreShortId = new this.web3.eth.Contract(require('./contracts/ItemStoreShortId.abi.json'), '0xb01e3aa376fe78e52d561623c4c6dd46c37e2529')
		this.itemDagComments = new this.web3.eth.Contract(require('./contracts/ItemDagOneParent.abi.json'), '0x674311e1f8d0382af87682281957404d372c4c86')
		this.itemDagFeedItems = new this.web3.eth.Contract(require('./contracts/ItemDagOnlyOwner.abi.json'), '0xe76d07974cad5b22fa9cdf25d7f8d451f757935e')
		this.accountRegistry = new this.web3.eth.Contract(require('./contracts/MixAccountRegistry.abi.json'), '0x82ef0fb799d79d3924301a309c5fd1c18fb2a804')
		this.accountProfile = new this.web3.eth.Contract(require('./contracts/AccountProfile.abi.json'), '0x2158c2344e6acd142aea4d8fcfd44d3b459d5786')
		this.accountFeeds = new this.web3.eth.Contract(require('./contracts/MixAccountItems.abi.json'), '0x04bdb9f1fd054c5c2d65f79f9d0fe9ddd9dfe01c')
		this.trustedAccounts = new this.web3.eth.Contract(require('./contracts/TrustedAccounts.abi.json'), '0xe1209fafc2887ed6d619e8a39d067a80e2bdfef3')
		this.reactions = new this.web3.eth.Contract(require('./contracts/MixReactions.abi.json'), '0x27eade6e5e8edc4a6d77581ac095ddaac7084ba6')
		this.tokenRegistryAddress = '0x71387fc1fc8238cb80d3ca3d67d07bb672a3a8d8'
		this.tokenRegistry = new this.web3.eth.Contract(require('./contracts/MixTokenRegistry.abi.json'), this.tokenRegistryAddress)

		// Emit sync info.
		let startingBlock, currentBlock
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
					vue.$emit('mix-client-syncing', isSyncing)
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
					await this.itemStoreIpfsSha256.methods.getItem('0x63c8e076a9474c83a12b76e4f0a9f1370fd65b27d404e0ef2af60a6f66ae9ec0').call()
					vue.$emit('mix-client-state')
					clearInterval(intervalId)
					resolve()
				}
				catch (e) {}
			}, 100);
		})
	}
}
