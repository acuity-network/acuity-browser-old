const itemStoreAbi = require('./contracts/ItemStoreInterface.abi.json')
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
          // Update the received bytes
          
          this.receivedBytes += chunk.length;
          this.emit('progress', this.progress());
      });

      this.req.on('end', () => {
          this.status = 'Complete'
          console.log(this.status)
          this.emit('done')
      });

      this.req.on('error', (err) => {
          console.log('File Download Error, '+ err)
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
        return await shell.moveItemToTrash(this.filePath)
      }
      catch(e) {
        return false;
      }
  }
  
  async openFileLocation() {
      return await shell.showItemInFolder(this.filePath);
  }

  status() {
    return this.status;
  }

  progress() {
      return ((this.receivedBytes/this.size) * 100)
  }

  sizeFormatted() {
    return formateByteCount(this.size)
  }

  name() {
    return this.name
  }

  size() {
    return this.size
  }

  hash() {
    return this.hash
  }

}
