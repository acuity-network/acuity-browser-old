import http from 'http'
import { randomHex } from 'web3-utils'
import { ipcRenderer } from 'electron'

export default class IpfsClient {
  agent: any

	async init(vue) {
		this.agent = new http.Agent({
			keepAlive: true,
		})

		if (!vue) return

    // Log IPFS output.
    ipcRenderer.on('ipfs-stdout', (event, msg) => {
      console.log('IPFS: ' + msg)
    })
    ipcRenderer.on('ipfs-stderr', (event, msg) => {
      console.error('IPFS: ' + msg)
    })
		// Wait for IPFS API to start working.
		await new Promise((resolve, reject) => {
			let intervalId = setInterval(async () => {
				try {
					await this.get('id')
					vue.$emit('ipfs-api')
					clearInterval(intervalId)
					resolve()
				}
				catch (e) {}
			}, 50)
		})

		// Wait for IPFS Gateway to start working.
		return new Promise((resolve, reject) => {
			let options = {
				path: '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',		// IPFS default file in repo
        port: 5102,
				timeout: 0,
			}

			let intervalId = setInterval(async () => {
				http.get(options)
				.on('response', res => {
					if (res.statusCode == 200) {
						vue.$emit('ipfs-gateway')
						clearInterval(intervalId)
						resolve()
					}
				})
			}, 50)
		})
	}

	_get(command: string, json: boolean = true) {
		return new Promise((resolve, reject) => {
			let options = {
				agent: this.agent,
				path: '/api/v0/' + command,
        port: 5101,
			}

			http.get(options)
			.on('response', res => {
				let body = ''
				res.on('data', data => {
					body += data
				})
				res.on('end', () => {
					resolve(json ? JSON.parse(body) : body)
				})
			})
			.on('error', (error) => {
			  reject(error)
			})
		})
	}

	_post(command: string, data: Buffer, encoding: string) {
		return new Promise((resolve, reject) => {
			let boundary = randomHex(32)

			let options = {
				agent: this.agent,
				headers: {
					'Content-Type': 'multipart/form-data; boundary=' + boundary,
				},
				method: 'POST',
				path: '/api/v0/' + command,
        port: 5101,
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

			req.write(postData, encoding)
			req.end()
		})
	}

  id() {
    return this._get('id').then((result: any) => {
      return {
        agentVersion: result.AgentVersion,
        protocolVersion: result.ProtocolVersion,
        addresses: result.Addresses,
      }
    })
  }

  peers() {
    return this._get('swarm/peers').then((result: any) => {
      return result.Peers
    })
  }

  repoStat() {
    return this._get('repo/stat').then((result: any) => {
      return {
        repoSize: result.RepoSize,
        numObjects: result.NumObjects,
      }
    })
  }

  get(ipfsHash: string) {
    return this._get('cat?arg=/ipfs/' + ipfsHash, false)
  }

  add(data, encoding: string = 'binary') {
    return this._post('add', data, encoding).then((result: any) => {
      console.log(result)
      return result.Hash
    })
  }

}
