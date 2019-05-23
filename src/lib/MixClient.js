import Web3 from 'web3'
import net from 'net'
import os from 'os'
import path from 'path'
import { remote } from 'electron'

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
		let success = false
		do {
			try {
				this.web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net))
				await this.web3.eth.getProtocolVersion()
				success = true
			}
			catch (e) {}
		} while (!success)

		this.web3.eth.defaultBlock = 'pending';

		this.itemStoreRegistry = new this.web3.eth.Contract(require('./contracts/ItemStoreRegistry.abi.json'), '0x8928f846012b98aac5cd2f4ef4029097cd4110fc')
		this.itemStoreIpfsSha256 = new this.web3.eth.Contract(require('./contracts/ItemStoreIpfsSha256.abi.json'), '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e')
		this.itemStoreShortId = new this.web3.eth.Contract(require('./contracts/ItemStoreShortId.abi.json'), '0xe8912dd1dc35bbd613dbc5f30fe8b20300ec9f79')
		this.itemDagComments = new this.web3.eth.Contract(require('./contracts/ItemDagOneParent.abi.json'), '0x8e7f6a1696b0e702ac1701b9048c47783483330e')
		this.itemDagFeedItems = new this.web3.eth.Contract(require('./contracts/ItemDag.abi.json'), '0xd6cc1712b46a599f87f023fad83bc06473bb2b8d')
		this.accountProfile = new this.web3.eth.Contract(require('./contracts/AccountProfile.abi.json'), '0x7855a6b883c39c8e87d51002b064180ddbf16026')
		this.accountFeeds = new this.web3.eth.Contract(require('./contracts/MixAccountItems.abi.json'), '0x988e19f9c1a004612b64ab100008897bbebc2470')
		this.trustedAccounts = new this.web3.eth.Contract(require('./contracts/TrustedAccounts.abi.json'), '0x11dc5cf838ae3850458f92474dc28d1e47f8e045')
		this.reactions = new this.web3.eth.Contract(require('./contracts/MixReactions.abi.json'), '0xc66af5a7e3699d5b9f03a6031ca8568dae7b6bd1')
		this.tokenRegistryAddress = '0x71387fc1fc8238cb80d3ca3d67d07bb672a3a8d8'
		this.tokenRegistry = new this.web3.eth.Contract(require('./contracts/MixTokenRegistry.abi.json'), this.tokenRegistryAddress)

		vue.$emit('mix-client-active')
	}
}
