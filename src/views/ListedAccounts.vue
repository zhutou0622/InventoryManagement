<template>
    <div class="listed-accounts-container">
      <el-card class="listed-accounts-card">
        <template #header>
          <div class="card-header">
            <h2>上架账号</h2>
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
            <el-table-column prop="comment" label="备注" min-width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button 
                    type="success" 
                    link 
                    @click="handleSold(scope.row)">
                    已售
                  </el-button>
                  <el-button 
                    type="warning" 
                    link 
                    @click="handleUnlist(scope.row)">
                    下架
                  </el-button>
                  <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>

                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
  
      <!-- 已售对话框 -->
      <el-dialog
        v-model="soldDialogVisible"
        title="确认售出"
        width="500px">
        <el-form
          ref="soldFormRef"
          :model="soldForm"
          :rules="soldRules"
          label-width="100px">
          
          <el-form-item label="售出日期" prop="soldDate">
            <el-date-picker
              v-model="soldForm.soldDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD">
            </el-date-picker>
          </el-form-item>
        </el-form>
  
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="soldDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitSoldForm">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted,computed } from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  const searchQuery = ref('')
  const tableData = ref([])
  const soldDialogVisible = ref(false)
  const soldFormRef = ref(null)
  const currentAccount = ref(null)
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
  const soldForm = reactive({
    soldDate: ''
  })
  
  const soldRules = {
    soldDate: [
      { required: true, message: '请选择售出日期', trigger: 'change' }
    ]
  }
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
    await loadListedAccounts()
  } catch (error) {
    if (error === 'cancel') return
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}
  // 加载上架账号
  const loadListedAccounts = async () => {
    try {
      const accounts = await window.electron.ipcRenderer.getAllAccounts()
      tableData.value = accounts.filter(account => account.status === 'listed')
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    }
  }
  
  // 标记为已售
  const handleSold = (row) => {
    currentAccount.value = row
    soldForm.soldDate = new Date().toISOString().split('T')[0]
    soldDialogVisible.value = true
  }
  
  // 提交已售表单
  const submitSoldForm = async () => {
    if (!soldFormRef.value) return
    
    try {
      await soldFormRef.value.validate()
      await window.electron.ipcRenderer.markAsSold({
        id: currentAccount.value.id,
        soldDate: soldForm.soldDate,
        sellPrice: currentAccount.value.sellPrice,
        purchasePrice: currentAccount.value.purchasePrice,
        platformDeposit: currentAccount.value.platformDeposit
      })
      
      ElMessage.success('标记已售成功')
      soldDialogVisible.value = false
      await loadListedAccounts()
    } catch (error) {
      console.error('标记已售失败:', error)
      ElMessage.error('标记已售失败')
    }
  }
  
  // 下架处理
  const handleUnlist = async (row) => {
    try {
      await ElMessageBox.confirm(
        `确定要下架账号 ${row.accountNumber} 吗？\n下架后该账号将返回到入库列表。`,
        '下架确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await window.electron.ipcRenderer.unlistAccount(row.id)
      ElMessage.success('下架成功')
      await loadListedAccounts()
    } catch (error) {
      if (error === 'cancel' || error.toString().includes('cancel')) {
        return
      }
      console.error('下架失败:', error)
      ElMessage.error('下架失败')
    }
  }
  
  onMounted(() => {
    loadListedAccounts()
  })
  </script>
  
  <style scoped>
  .listed-accounts-container {
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  .listed-accounts-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .listed-accounts-card :deep(.el-card__body) {
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
  
  .operation-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-start;
    align-items: center;
  }
  
  .operation-buttons :deep(.el-button) {
    padding: 4px 8px;
    margin: 0;
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
  
  :deep(.el-table__body-wrapper::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }
  
  :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
    background: #dcdfe6;
    border-radius: 4px;
  }
  
  :deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
    background: #f5f7fa;
  }
  </style>