'use strict'

import { app, BrowserWindow, Menu } from 'electron'
import path from 'path'
import parity from '../lib/Parity.js'
import ipfs from '../lib/Ipfs.js'
import { shell } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { format as formatUrl } from 'url'
import contextMenu from 'electron-context-menu'

let isDevelopment = process.env.NODE_ENV !== 'production'
let mainWindow

async function createWindow () {
  // Set up context menu.
  contextMenu({
    menu: actions => [
      actions.cut(),
      actions.copy(),
      actions.paste(),
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
