let level: any = require('level')

function init() {
  let dbPath: string = 'mix-acuity'
  console.log('Initializing database: ' + dbPath)
  return level(dbPath)
}

export default { init }
