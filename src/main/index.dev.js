import {app} from 'electron'
import path from 'path'

app.setName('Acuity')
app.setPath('userData', path.join(app.getPath('appData'), app.getName()))

require('./index.js')
