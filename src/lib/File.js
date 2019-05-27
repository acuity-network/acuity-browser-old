let itemStoreAbi = require('./contracts/ItemStoreInterface.abi.json')
import request from 'request'
import { remote, shell } from 'electron'
import path from 'path'
import unusedFilename from 'unused-filename'
import formateByteCount from './formatByteCount.js'
import EventEmitter from 'events'
import fs from 'fs-extra'

export default class File extends EventEmitter {

  constructor(vue, _name, _size, _hash) {
    super();
    this.vue = vue
    this.status = 'Created'
    this.name = _name;
    this.size = _size;
    this.hash = _hash;
    this.receivedBytes = 0;
  }

  download() {

    window.downloads.push(this)
    let notification = this.vue.$notifications.downloadStarted(this.name)
    new Notification(notification.title, notification)
    this.vue.$root.$emit('start-download', this)

    let fileUrl = "http://127.0.0.1:5001/api/v0/cat?arg=/ipfs/" + this.hash
    let uncheckedFilePath = path.join(remote.app.getPath('downloads'), this.name)

    unusedFilename(uncheckedFilePath).then(_filePath => {

      this.filePath = _filePath;
      this.status = 'Downloading'
      this.req = request({
          method: 'GET',
          uri: fileUrl
      });

      let out = fs.createWriteStream(this.filePath);
      this.req.pipe(out);

      this.req.on('response', (data) => {
      });

      this.req.on('data', (chunk) => {
          this.receivedBytes += chunk.length;
          this.emit('progress', this.getProgress());
      });

      this.req.on('end', () => {
          let notification = this.vue.$notifications.downloadComplete(this.name)
          new Notification(notification.title, notification)
          this.vue.$root.$emit('stop-download', this)

          this.status = 'Complete'
          this.emit('done')
      });

      this.req.on('error', (err) => {
          this.status = 'Error'
          this.emit('error', err);
      })

    });

  }

  async openFile() {
    return await shell.openItem(this.filePath);
  }

  async stopdeleteFile() {
      try {
        this.req.abort();
        await shell.moveItemToTrash(this.filePath)
        this.status = 'Deleted'
        this.vue.$root.$emit('stop-download', this)
        return true;
      }
      catch(e) {
        return false;
      }
  }

  async openFileLocation() {
      return await shell.showItemInFolder(this.filePath);
  }

  getProgress() {
    return ( Math.ceil((this.receivedBytes/this.size) * 100) )
  }

  getStatus() {
    return this.status
  }

  sizeFormatted() {
    return formateByteCount(this.size)
  }

  getName() {
    return this.name
  }

  getSize() {
    return this.size
  }

  getHash() {
    return this.hash
  }

}
