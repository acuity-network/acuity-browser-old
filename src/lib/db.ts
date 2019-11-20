import { remote } from 'electron'
import path from 'path'
import level from 'level'

function init() {
  let dbPath: string  = path.join(remote.app.getPath('userData'), 'state.db')
  console.log('Initializing database: ' + dbPath)
  return level(dbPath)
}

export default { init }
