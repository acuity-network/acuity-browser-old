'use strict'

import { app, BrowserWindow, Menu } from 'electron'
import electronDebug from 'electron-debug'
electronDebug({ enabled: true, showDevTools: false, devToolsMode: 'right' })

import path from 'path'
import parity from '../lib/Parity.js'
import ipfs from '../lib/Ipfs.js'
import { shell } from 'electron'
import windowStateKeeper from 'electron-window-state'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let winURL = process.env.NODE_ENV === 'development'
  ? `http://127.0.0.1:9080`
  : `file://${__dirname}/index.html`

async function createWindow () {
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
  }

  if (process.platform === 'linux') {
    if (process.env.NODE_ENV !== 'development') {
      windowOptions.icon = path.join(app.getAppPath(), '..', 'extraResources', 'icon.png')
    }
    else {
      windowOptions.icon = path.join(app.getAppPath(), '..', '..', '..', '..', '..', 'src', 'extraResources', 'icon.png')
    }
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow(windowOptions)
  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.platform === 'darwin') {
    let template = [{
      label: 'FromScratch',
      submenu: [{
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: function() {
          app.quit();
        }
      }]
    }, {
      label: 'Edit',
      submenu: [{
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      }, {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      }]
    }];

    let osxMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(osxMenu);
  }

  // Force links to open in web browser.
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  });

  // Launch IPFS.
  ipfs.launch(mainWindow)
  // Launch Parity.
  parity.launch(mainWindow)
}

app.on('ready', createWindow)

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('will-quit', () => {
  parity.kill()
  ipfs.kill()
})

app.on('window-all-closed', () => {
  app.quit()
})
