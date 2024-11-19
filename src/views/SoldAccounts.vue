<template>
    <div class="sold-accounts-container">
      <el-card class="sold-accounts-card">
        <template #header>
          <div class="card-header">
            <h2>已售账号</h2>
          </div>
        </template>
  
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索账号"
            class="search-input"
            clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
  
        <!-- 账号表格 -->
        <div class="table-container">
          <el-table 
            :data="filteredTableData" 
            style="width: 100%"
            height="100%">
            <el-table-column prop="purchaseSource" label="账号来源" min-width="120" />
            <el-table-column prop="purchaseDate" label="收购日期" min-width="120" />
            <el-table-column prop="purchasePrice" label="收购价格" min-width="120" />
            <el-table-column prop="accountNumber" label="账号" min-width="180" />
            <el-table-column prop="password" label="密码" min-width="180" />
            <el-table-column prop="sellPlatform" label="出售平台" min-width="120" />
            <el-table-column prop="sellPrice" label="出售价格" min-width="120" />
            <el-table-column prop="platformDeposit" label="平台保证金" min-width="120" />
            <el-table-column prop="listingDate" label="上架日期" min-width="120" />
            <el-table-column prop="soldDate" label="售出日期" min-width="120" />
            <el-table-column prop="comment" label="备注" min-width="120" />
            <el-table-column prop="profit" label="利润" min-width="120">
              <template #default="scope">
                <span :class="{ 'profit-positive': scope.row.profit > 0, 'profit-negative': scope.row.profit < 0 }">
                  {{ scope.row.profit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted ,computed} from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import { ElMessage ,ElMessageBox} from 'element-plus'
  
  const searchQuery = ref('')
  const tableData = ref([])
  const filteredTableData = computed(() => {
  if (!searchQuery.value) return tableData.value
  
  const query = searchQuery.value.toLowerCase()
  return tableData.value.filter(item => {
    return (
      item.accountNumber?.toLowerCase().includes(query) ||
      item.purchaseSource?.toLowerCase().includes(query) ||
      item.password?.toLowerCase().includes(query) ||
      item.sellPlatform?.toLowerCase().includes(query)
    )
  })
})
// 删除处理
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账号 ${row.accountNumber} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await window.electron.ipcRenderer.deleteAccount(row.id)
    ElMessage.success('删除成功')
    await loadAccounts()
  } catch (error) {
    if (error === 'cancel') return
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}
  // 加载已售账号
  const loadSoldAccounts = async () => {
    try {
      const accounts = await window.electron.ipcRenderer.getAllAccounts()
      tableData.value = accounts.filter(account => account.status === 'sold')
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    }
  }
  
  onMounted(() => {
    loadSoldAccounts()
  })
  </script>
  
  <style scoped>
  .sold-accounts-container {
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  .sold-accounts-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .sold-accounts-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h2 {
    margin: 0;
    color: #409EFF;
  }
  
  .search-bar {
    margin-bottom: 20px;
  }
  
  .search-input {
    width: 300px;
  }
  
  .table-container {
    flex: 1;
    overflow: hidden;
  }
  
  .profit-positive {
    color: #67C23A;
    font-weight: bold;
  }
  
  .profit-negative {
    color: #F56C6C;
    font-weight: bold;
  }
  
  /* 表格样式优化 */
  :deep(.el-table) {
    height: 100%;
  }
  
  :deep(.el-table__header) {
    background-color: #f5f7fa;
  }
  
  :deep(.el-table__row) {
    height: 50px;
  }
  </style>