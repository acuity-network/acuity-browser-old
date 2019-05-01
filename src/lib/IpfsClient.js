import http from 'http'

let agent = new http.Agent({
	port: 5001,
	keepAlive: true,
});

function get(command, json = true) {
	return new Promise((resolve, reject) => {
		let options = {
			agent: agent,
			path: '/api/v0/' + command,
		}

		http.request(options)
		.on('response', res => {
			let body = ''
			res.on('data', data => {
				body += data
			})
			res.on('end', () => {
				if (json) {
					resolve(JSON.parse(body))
				}
				else {
					resolve(body)
				}
			})
		})
		.on('error', (error) => {
		  reject(error)
		})
		.end()
	})
}

export default { get }
