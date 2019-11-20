/*
import Web3 from 'web3'
import net from 'net'
import Api from '@parity/api'
import throttle from 'just-throttle'
*/

export default class MixClient {
	web3: any
  formatWei: any
	parityApi: any
	itemStoreRegistry: any
	itemStoreIpfsSha256: any
	itemStoreShortId: any
	itemDagMixins: any
	itemDagComments: any
	itemDagFeedItems: any
	itemDagTokenItems: any
	itemTopics: any
	itemMentions: any
	accountRegistry: any
	accountProfile: any
	accountFeeds: any
	accountTokens: any
	trustedAccounts: any
	reactions: any
	tokenItemRegistryAddress: any
	tokenItemRegistry: any
	tokenItemRegistryOld: any
  tokenBurnAddress: any
	tokenBurn: any
	uniswapFactory: any

	async init(vue) {
	}
}
