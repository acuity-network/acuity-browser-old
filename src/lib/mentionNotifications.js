import MixAccount from '../lib/MixAccount.js'
import MixItem from '../lib/MixItem.js'


let emitter

async function launch(vue) {

	let accounts = []
	// Get accounts.
	await vue.$db.createValueStream({
		'gt': '/account/controllerAddress/',
		'lt': '/account/controllerAddress/z',
	})
	.on('data', async controller => {
		let account = await new MixAccount(vue, controller).init()
		if (!account.contract) {
			return
		}
		accounts.push(account.contractAddress)
	})

	emitter = vue.$mixClient.itemMentions.events.AddItem({
		toBlock: 'pending',
		filter: {account: accounts},
	})
	.on('data', async log => {
		let item = await new MixItem(vue, log.returnValues.itemId).init()
		let revision = await item.latestRevision().load()

		let account = await item.account()
		let profileItemId = await account.call(vue.$mixClient.accountProfile, 'getProfile')
		let profileItem = await new MixItem(vue, profileItemId).init()
		let profileRevision = await profileItem.latestRevision().load()
		let avatarUrl = profileRevision.getImageUrl(200, 200)

		let notification = {
			tag: log.returnValues.itemId,
//			lang:
			badge: avatarUrl,
			body: revision.getBodyText(),
			icon: avatarUrl,
		}

		try {
			notification.image = revision.getImageUrl(1000, 1000)
		}
		catch(e) {

		}

		new Notification(revision.getTitle(), notification)
	})
}

function kill() {
	emitter.unsubscribe()
}

export default { launch, kill }
