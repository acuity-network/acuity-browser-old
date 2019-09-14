export default class Settings {

	async init(db) {
		this.db = db
	  try {
			this.settings = JSON.parse(await this.db.get('/settings'))
		}
		catch (e) {
			this.settings = {}
		}
		return this
	}

	set(key, value) {
		this.settings[key] = value
		this.db.put('/settings', JSON.stringify(this.settings))
	}

	get(key) {
		if (key in this.settings) {
			return this.settings[key]
		}

		let defaults = {
			locale: 'en-US',
			development: false,
		}

		return defaults[key]
	}

}
