const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const db = new sqlite3.Database(path.join(__dirname, 'inventory.db'))

// 创建账号表
db.run(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountNumber TEXT NOT NULL,
    password TEXT NOT NULL,
    purchaseSource TEXT NOT NULL,
    purchaseDate TEXT NOT NULL,
    purchasePrice REAL NOT NULL,
    status TEXT DEFAULT 'in_stock',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

const dbOperations = {
  // 添加账号
  addAccount(account) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO accounts (accountNumber, password, purchaseSource, purchaseDate, purchasePrice)
        VALUES (?, ?, ?, ?, ?)
      `
      db.run(sql, [
        account.accountNumber,
        account.password,
        account.purchaseSource,
        account.purchaseDate,
        account.purchasePrice
      ], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  },

  // 获取所有账号
  getAllAccounts() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM accounts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }
}

module.exports = dbOperations