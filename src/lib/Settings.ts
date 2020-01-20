export default class Settings {
	db: any
	settings: any

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
      mixEndpoint: 'freemont',
			development: false,
      'h264.crf': 23,
      'h264.preset': 'medium',
      'vp9.crf': 31,
      'vp9.speed': 2,
		}

		return defaults[key]
	}

}
