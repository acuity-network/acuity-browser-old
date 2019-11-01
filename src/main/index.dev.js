import {app} from 'electron'
import path from 'path'

app.name = 'MIX Acuity'
app.setPath('userData', path.join(app.getPath('appData'), app.name))

require('./index.js')
