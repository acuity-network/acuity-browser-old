import http from 'http'
import { randomHex } from 'web3-utils'

export default class IpfsClient {

	async init() {
		this.agent = new http.Agent({
			port: 5101,
			keepAlive: true,
		});

		// Wait for IPFS to start working.
		return new Promise((resolve, reject) => {
			let intervalId = setInterval(async () => {
				try {
					await this.get('id')
					clearInterval(intervalId)
					resolve()
				}
				catch (e) {}
			}, 50);
		})
	}

	get(command, json = true) {
		return new Promise((resolve, reject) => {
			let options = {
				agent: this.agent,
				path: '/api/v0/' + command,
			}

			http.get(options)
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
		})
	}

	post(command, data) {
		return new Promise((resolve, reject) => {
			let boundary = randomHex(32)

			let options = {
				agent: this.agent,
				headers: {
					'Content-Type': 'multipart/form-data; boundary=' + boundary,
				},
				method: 'POST',
				path: '/api/v0/' + command,
			}

			let postData = '--' + boundary + '\r\n'
			postData += 'Content-Disposition: form-data"\r\n'
			postData += 'Content-Type: application/octet-stream\r\n\r\n'
			postData += data.toString('binary')
			postData += '\r\n--' + boundary + '--\r\n'

			let req = http.request(options)
			.on('response', res => {
				let body = ''
				res.on('data', data => {
					body += data
				})
				res.on('end', () => {
					resolve(JSON.parse(body))
				})
			})
			.on('error', (error) => {
			  reject(error)
			})

			req.write(postData);
			req.end();
		})
	}

}
