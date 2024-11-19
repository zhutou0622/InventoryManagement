const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,  // 开发环境下禁用 web 安全性
      webviewTag: true
    }
  })

  // 处理证书错误
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true)
  })

  if (isDev) {
    // 允许加载不安全的内容
    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true)
    })
    
    win.loadURL('http://localhost:5173')
    // 打开开发者工具
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// 处理证书错误
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault()
  callback(true)
})

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})