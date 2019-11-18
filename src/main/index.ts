'use strict'

import { app, BrowserWindow } from 'electron'
import path from 'path'
import parity from '../lib/Parity'
import ipfs from '../lib/Ipfs'
import { shell } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { format as formatUrl } from 'url'
import contextMenu from 'electron-context-menu'

declare let __static: string
let isDevelopment = process.env.NODE_ENV !== 'production'

if (isDevelopment) {
  app.name = 'MIX Acuity'
  app.setPath('userData', path.join(app.getPath('appData'), app.name))
}

let mainWindow

async function createWindow () {
  // Set up context menu.
  contextMenu({
    menu: actions => [
      actions.cut({}),
      actions.copy({}),
      actions.paste({}),
    ],
  })
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  let windowOptions = {
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    backgroundColor: '#191919',
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__static, 'icon.png'),
    title: 'MIX Acuity Browser',
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow(windowOptions)
  mainWindowState.manage(mainWindow);

  if (isDevelopment) {
    mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    require('vue-devtools').install()
  }
  else {
    mainWindow.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Force links to open in web browser.
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  });

  // Launch Parity.
  parity.launch(mainWindow)
  // Launch IPFS.
  ipfs.launch(mainWindow)
}

let gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('ready', createWindow)

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })

  app.on('quit', async () => {
    await Promise.all([parity.kill(), ipfs.kill()])
  })
}
