const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')
const isDev = process.env.NODE_ENV === 'development'
const fs = require('fs')

// 将 db 声明为全局变量
let db = null
let mainWindow = null


const dbPath = isDev 
  ? path.join(__dirname, '../database/inventory.db')
  : path.join(process.resourcesPath, 'database/inventory.db')

// 初始化数据库函数
function initDatabase() {
  try {
    // 确保数据库目录存在
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // 初始化数据库连接
    db = new Database(dbPath)
    console.log('数据库连接成功')

    // 初始化表结构
    initTables()
    
    return true
  } catch (err) {
    console.error('数据库初始化失败:', err)
    return false
  }
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'PUBG账号库存管理系统',  // 设置窗口标题
    icon: path.join(__dirname, '../src/assets/cc.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,  // 自动隐藏菜单栏
    menuBarVisible: false   // 默认不显示菜单栏
  })
   // 在窗口加载完成后清除登录状态
   mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
    `)
  })
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// 初始化数据库
// 初始化数据库
function initTables() { 
try {
    const db = new Database(dbPath)
    console.log('数据库连接成功')
  
    // 检查accounts表是否存在
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'"
    ).get()
  
    if (!tableExists) {
      // 表不存在，创建新表
      db.prepare(`
        CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          accountNumber TEXT NOT NULL,
          password TEXT NOT NULL,
          purchaseSource TEXT NOT NULL,
          purchaseDate TEXT NOT NULL,
          purchasePrice REAL NOT NULL,
          status TEXT DEFAULT 'in_stock',
          sellPlatform TEXT,
          sellPrice REAL,
          platformDeposit REAL,
          listingDate TEXT,
          soldDate TEXT,
          profit REAL,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      console.log('创建表成功')
    } else {
      // 表已存在，添加新列
      const columns = [
        'sellPlatform TEXT',
        'sellPrice REAL',
        'platformDeposit REAL',
        'listingDate TEXT'
      ]
  
      // 使用事务来处理列添加
      db.transaction(() => {
        columns.forEach(column => {
          try {
            db.prepare(`ALTER TABLE accounts ADD COLUMN ${column}`).run()
          } catch (err) {
            // 忽略重复列错误
            if (!err.message.includes('duplicate column')) {
              throw err
            }
          }
        })
      })()
  
      console.log('更新表结构完成')
    }
  
    // 创建来源表
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
  
    console.log('数据库初始化完成')
  
  } catch (err) {
    console.error('数据库初始化失败:', err)
    app.quit()
  } }

app.whenReady().then(() => {
  // 先初始化数据库
  if (!initDatabase()) {
    console.error('数据库初始化失败，应用将退出')
    app.quit()
    return
  }
  createWindow()

  // 注册 IPC 处理器
  ipcMain.handle('addAccount', async (event, account) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO accounts (
          accountNumber, password, purchaseSource, 
          purchaseDate, purchasePrice, comment
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      const result = stmt.run(
        account.accountNumber,
        account.password,
        account.purchaseSource,
        account.purchaseDate,
        account.purchasePrice,
        account.comment
      )
      
      console.log('添加账号成功, ID:', result.lastInsertRowid)
      return result.lastInsertRowid
    } catch (err) {
      console.error('添加账号失败:', err)
      throw err
    }
  })
  // 添加标记已售的IPC处理器
  ipcMain.handle('markAsSold', async (event, data) => {
    try {
      const profit = data.sellPrice - data.purchasePrice - data.platformDeposit
      const stmt = db.prepare(`
        UPDATE accounts 
        SET status = 'sold',
            soldDate = ?,
            profit = ?
        WHERE id = ?
      `)
      
      stmt.run(data.soldDate, profit, data.id)
      console.log('标记已售成功')
      return true
    } catch (err) {
      console.error('标记已售失败:', err)
      throw err
    }
  })
 // 获取账号统计数据

 ipcMain.handle('getAccountStatistics', async () => {
    try {
      const row = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'in_stock' OR status IS NULL THEN 1 END) as totalInStock,
          COUNT(CASE WHEN status = 'listed' THEN 1 END) as totalListed,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as totalSold,
          COALESCE(SUM(CASE 
            WHEN status = 'sold' 
            THEN sellPrice - purchasePrice 
            ELSE 0 
          END), 0) as totalProfit
        FROM accounts
      `).get()
      
      return {
        totalInStock: row.totalInStock || 0,
        totalListed: row.totalListed || 0,
        totalSold: row.totalSold || 0,
        totalProfit: row.totalProfit || 0
      }
    } catch (err) {
      console.error('获取统计数据失败:', err)
      throw err
    }
  })
 // 获取可用年份
 ipcMain.handle('getAvailableYears', async () => {
    try {
      const rows = db.prepare(`
        SELECT DISTINCT strftime('%Y', purchaseDate) as year
        FROM accounts
        UNION
        SELECT DISTINCT strftime('%Y', listingDate) as year
        FROM accounts
        WHERE listingDate IS NOT NULL
        UNION
        SELECT DISTINCT strftime('%Y', soldDate) as year
        FROM accounts
        WHERE soldDate IS NOT NULL
        ORDER BY year DESC
      `).all()
      
      const years = rows.map(row => parseInt(row.year)).filter(year => !isNaN(year))
      console.log('可用年份:', years)
      return years
    } catch (err) {
      console.error('获取年份失败:', err)
      throw err
    }
  })
  
// 获取指定年份的月度统计数据
ipcMain.handle('getMonthlyStatistics', async (event, year) => {
    try {
      const rows = db.prepare(`
        WITH RECURSIVE months(month_num, month) AS (
          SELECT 1, '${year}-01'
          UNION ALL
          SELECT month_num + 1, 
                 printf('${year}-%02d', month_num + 1)
          FROM months
          WHERE month_num < 12
        )
        SELECT 
          m.month,
          COALESCE(COUNT(CASE 
            WHEN a.status = 'in_stock' 
            AND strftime('%Y-%m', a.purchaseDate) = m.month 
            THEN 1 
          END), 0) as inStock,
          COALESCE(COUNT(CASE 
            WHEN a.status = 'listed' 
            AND strftime('%Y-%m', a.listingDate) = m.month 
            THEN 1 
          END), 0) as listed,
          COALESCE(COUNT(CASE 
            WHEN a.status = 'sold' 
            AND strftime('%Y-%m', a.soldDate) = m.month 
            THEN 1 
          END), 0) as sold
        FROM months m
        LEFT JOIN accounts a ON (
          strftime('%Y-%m', a.purchaseDate) = m.month OR
          strftime('%Y-%m', a.listingDate) = m.month OR
          strftime('%Y-%m', a.soldDate) = m.month
        )
        GROUP BY m.month
        ORDER BY m.month
      `).all()
      
      // 确保返回12个月的数据
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1
        const monthStr = `${year}-${monthNum.toString().padStart(2, '0')}`
        return rows.find(row => row.month === monthStr) || {
          month: monthStr,
          inStock: 0,
          listed: 0,
          sold: 0
        }
      })
      
      return allMonths
    } catch (err) {
      console.error('获取月度统计失败:', err)
      throw err
    }
  })
  
// 同样需要修改月度利润统计
ipcMain.handle('getMonthlyProfit', async (event, year) => {
    try {
      const rows = db.prepare(`
        WITH RECURSIVE months(month_num, month) AS (
          SELECT 1, '${year}-01'
          UNION ALL
          SELECT month_num + 1, 
                 printf('${year}-%02d', month_num + 1)
          FROM months
          WHERE month_num < 12
        )
        SELECT 
          m.month,
          COALESCE(SUM(a.purchasePrice), 0) as totalCost,
          COALESCE(SUM(a.sellPrice), 0) as totalRevenue,
          COALESCE(SUM(a.sellPrice - a.purchasePrice), 0) as netProfit
        FROM months m
        LEFT JOIN accounts a ON strftime('%Y-%m', a.soldDate) = m.month
          AND a.status = 'sold'
        GROUP BY m.month
        ORDER BY m.month
      `).all()
      
      // 确保返回12个月的数据
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1
        const monthStr = `${year}-${monthNum.toString().padStart(2, '0')}`
        return rows.find(row => row.month === monthStr) || {
          month: monthStr,
          totalCost: 0,
          totalRevenue: 0,
          netProfit: 0
        }
      })
      
      console.log('月度利润:', allMonths)
      return allMonths
      
    } catch (err) {
      console.error('获取月度利润失败:', err)
      throw err
    }
  })
// 删除账号
ipcMain.handle('deleteAccount', async (event, id) => {
    try {
      console.log('正在删除账号:', id)
      const stmt = db.prepare('DELETE FROM accounts WHERE id = ?')
      stmt.run(id)
      console.log('删除账号成功')
      return true
    } catch (err) {
      console.error('删除账号失败:', err)
      throw err
    }
  })
  
  // 添加来源
  ipcMain.handle('addSource', async (event, source) => {
    try {
      console.log('正在添加来源:', source)
      const stmt = db.prepare('INSERT INTO sources (name, description) VALUES (?, ?)')
      const result = stmt.run(source.name, source.description)
      console.log('添加来源成功, ID:', result.lastInsertRowid)
      return result.lastInsertRowid
    } catch (err) {
      console.error('添加来源失败:', err)
      throw err
    }
  })
  
  // 下架账号
  ipcMain.handle('unlistAccount', async (event, id) => {
    try {
      console.log('正在下架账号:', id)
      const stmt = db.prepare(`
        UPDATE accounts 
        SET status = 'in_stock', 
            sellPlatform = NULL, 
            sellPrice = NULL, 
            platformDeposit = NULL, 
            listingDate = NULL
        WHERE id = ?
      `)
      stmt.run(id)
      console.log('下架账号成功')
      return true
    } catch (err) {
      console.error('下架账号失败:', err)
      throw err
    }
  })
  
  // 获取所有来源
  ipcMain.handle('getAllSources', async () => {
    try {
      console.log('正在获取所有来源')
      const rows = db.prepare('SELECT * FROM sources ORDER BY created_at DESC').all()
      console.log('获取来源列表成功, 数量:', rows.length)
      return rows
    } catch (err) {
      console.error('获取来源列表失败:', err)
      throw err
    }
  })
  
  // 删除来源
  ipcMain.handle('deleteSource', async (event, id) => {
    try {
      console.log('正在删除来源:', id)
      const stmt = db.prepare('DELETE FROM sources WHERE id = ?')
      stmt.run(id)
      console.log('删除来源成功')
      return true
    } catch (err) {
      console.error('删除来源失败:', err)
      throw err
    }
  })
  
  // 获取所有账号
  ipcMain.handle('getAllAccounts', async () => {
    try {
      console.log('正在获取所有账号')
      const rows = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all()
      console.log('获取账号列表成功, 数量:', rows.length)
      return rows
    } catch (err) {
      console.error('获取账号列表失败:', err)
      throw err
    }
  })
  
  // 更新账号上架信息
  ipcMain.handle('updateAccountListing', async (event, data) => {
    try {
      console.log('正在更新账号上架信息:', data)
      const stmt = db.prepare(`
        UPDATE accounts 
        SET status = 'listed', 
            sellPlatform = ?, 
            sellPrice = ?, 
            platformDeposit = ?, 
            listingDate = ?
        WHERE id = ?
      `)
      stmt.run(
        data.sellPlatform,
        data.sellPrice,
        data.platformDeposit,
        data.listingDate,
        data.id
      )
      console.log('更新账号上架信息成功')
      return true
    } catch (err) {
      console.error('更新账号上架信息失败:', err)
      throw err
    }
  })
  
  // 更新账号状态
  ipcMain.handle('updateAccountStatus', async (event, data) => {
    try {
      console.log('正在更新账号状态:', data)
      const stmt = db.prepare('UPDATE accounts SET status = ? WHERE id = ?')
      stmt.run(data.status, data.id)
      console.log('更新账号状态成功')
      return true
    } catch (err) {
      console.error('更新账号状态失败:', err)
      throw err
    }
  })
  // 更新账号
ipcMain.handle('updateAccount', async (event, data) => {
    try {
      console.log('正在更新账号:', data)
      const stmt = db.prepare(`
        UPDATE accounts 
        SET accountNumber = ?,
            password = ?,
            purchaseSource = ?,
            purchaseDate = ?,
            purchasePrice = ?,
            comment = ?
        WHERE id = ?
      `)
      
      stmt.run(
        data.accountNumber,
        data.password,
        data.purchaseSource,
        data.purchaseDate,
        data.purchasePrice,
        data.comment,
        data.id
      )
      
      console.log('更新账号成功')
      return true
    } catch (err) {
      console.error('更新账号失败:', err)
      throw err
    }
  })
// 应用退出时关闭数据库
app.on('window-all-closed', () => {
  if (db) {
    try {
      db.close()
      console.log('数据库已关闭')
    } catch (err) {
      console.error('关闭数据库失败:', err)
    }
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 应用退出时关闭数据库
app.on('before-quit', () => {
    try {
      db.close()
      console.log('数据库已关闭')
    } catch (err) {
      console.error('关闭数据库失败:', err)
    }
  })
})