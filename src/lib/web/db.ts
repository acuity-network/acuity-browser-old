import level from 'level'

function init() {
  let dbPath: 'mix-acuity'
  console.log('Initializing database: ' + dbPath)
  return level(dbPath)
}

export default { init }
