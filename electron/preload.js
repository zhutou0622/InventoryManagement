const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    addAccount: (account) => ipcRenderer.invoke('addAccount', account),
    getAllAccounts: () => ipcRenderer.invoke('getAllAccounts'),
    deleteAccount: (id) => ipcRenderer.invoke('deleteAccount', id),
    addSource: (source) => ipcRenderer.invoke('addSource', source),
    getAllSources: () => ipcRenderer.invoke('getAllSources'),
    deleteSource: (id) => ipcRenderer.invoke('deleteSource', id),
    updateAccountListing: (data) => ipcRenderer.invoke('updateAccountListing', data),
    updateAccountStatus: (data) => ipcRenderer.invoke('updateAccountStatus', data),
    unlistAccount: (id) => ipcRenderer.invoke('unlistAccount', id),
    markAsSold: (data) => ipcRenderer.invoke('markAsSold', data),
    updateAccount: (data) => ipcRenderer.invoke('updateAccount', data),
  // 添加新的统计相关方法
  getAccountStatistics: () => ipcRenderer.invoke('getAccountStatistics'),
  getAvailableYears: () => ipcRenderer.invoke('getAvailableYears'),
  getMonthlyStatistics: (year) => ipcRenderer.invoke('getMonthlyStatistics', year),
  getMonthlyProfit: (year) => ipcRenderer.invoke('getMonthlyProfit', year),
  }
})