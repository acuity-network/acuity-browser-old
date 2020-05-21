import http from 'http'
import { randomHex } from 'web3-utils'
import { ipcRenderer } from 'electron'

export default class IpfsClient {
  agent: any

	async init(vue: any) {
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
					await this._get('id')
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
        host: '127.0.0.1',  // must be ip address to prevent redirect
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

	_get(command: string, json: boolean = true): Promise<any> {
		return new Promise((resolve, reject) => {
			let options = {
				agent: this.agent,
				path: '/api/v0/' + command,
        port: 5101,
        method: 'POST',
			}

			let req: any = http.request(options)
			.on('response', res => {
				let body = ''
				res.on('data', (data: any) => {
					body += data
				})
				res.on('end', () => {
					resolve(json ? JSON.parse(body) : body)
				})
			})
			.on('error', async (error: any) => {
				if (req.reusedSocket && error.code === 'ECONNRESET') {
					try {
						resolve(await this._get(command, json))
					}
					catch (error) {
						reject(error)
					}
				}
				else {
					reject(error)
				}
			})
      .end()
		})
	}

	_post(command: string, data: Buffer, encoding: string): Promise<any> {
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

			let req: any = http.request(options)
			.on('response', res => {
				let body = ''
				res.on('data', (data: any) => {
					body += data
				})
				res.on('end', () => {
					resolve(JSON.parse(body))
				})
			})
			.on('error', async (error: any) => {
        if (req.reusedSocket && error.code === 'ECONNRESET') {
					try {
						resolve(await this._post(command, data, encoding))
					}
					catch (error) {
						reject(error)
					}
				}
				else {
					reject(error)
				}
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

  add(data: Buffer, encoding: string = 'binary') {
    return this._post('add', data, encoding).then((result: any) => {
      return result.Hash
    })
  }

}
