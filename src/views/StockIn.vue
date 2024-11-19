<template>
  <div class="stock-in-container">
    <!-- 库存列表卡片 -->
    <el-card class="stock-list-card">
      <template #header>
        <div class="card-header">
          <h2>库存列表</h2>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>添加账号
          </el-button>
        </div>
      </template>

       <!-- 修改搜索栏 -->
  <div class="search-bar">
    <el-input
      v-model="searchQuery"
      placeholder="搜索账号/来源/密码"
      class="search-input"
      clearable>
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
  </div>

      <div class="table-container">
        <el-table 
          :data="filteredTableData"
          style="width: 100%"
          height="100%">
          <el-table-column prop="accountNumber" label="账号" min-width="180" />
          <el-table-column prop="password" label="密码" min-width="180" />
          <el-table-column prop="purchaseSource" label="来源" min-width="120" />
          <el-table-column prop="purchaseDate" label="入库日期" min-width="120" />
          <el-table-column prop="purchasePrice" label="收购价格" min-width="120" />
          <el-table-column prop="comment" label="备注" min-width="120" />
          <el-table-column label="操作" min-width="220" fixed="right">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
                <el-button type="success" link @click="handleListing(scope.row)">上架</el-button>
                <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
    
      </div>
    </el-card>
 

    <!-- 添加账号对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加账号' : '编辑账号'"
      width="500px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px">
        
        <el-form-item label="账号" prop="accountNumber">
          <el-input v-model="form.accountNumber" placeholder="请输入账号"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <!-- 在表单中修改来源选择 -->
  <el-form-item label="收购来源" prop="purchaseSource">
    <el-select v-model="form.purchaseSource" placeholder="请选择来源">
      <el-option
        v-for="option in sourceOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value">
      </el-option>
    </el-select>
  </el-form-item>

        <el-form-item label="收购日期" prop="purchaseDate">
          <el-date-picker
            v-model="form.purchaseDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD">
          </el-date-picker>
        </el-form-item>

        <el-form-item label="收购价格" prop="purchasePrice">
          <el-input-number 
            v-model="form.purchasePrice"
            :precision="2"
            :step="0.1"
            :min="0">
          </el-input-number>
        </el-form-item>

        <el-form-item label="备注" prop="comment">
          <el-input v-model="form.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>



   <!-- 添加上架对话框 -->
   <el-dialog
    v-model="listingDialogVisible"
    title="账号上架"
    width="500px">
    <el-form
      ref="listingFormRef"
      :model="listingForm"
      :rules="listingRules"
      label-width="100px">
      
      <el-form-item label="出售平台" prop="sellPlatform">
        <el-input v-model="listingForm.sellPlatform" placeholder="请输入出售平台"></el-input>
      </el-form-item>

      <el-form-item label="出售价格" prop="sellPrice">
        <el-input-number 
          v-model="listingForm.sellPrice"
          :precision="2"
          :step="0.1"
          :min="0">
        </el-input-number>
      </el-form-item>

      <el-form-item label="平台保证金" prop="platformDeposit">
        <el-input-number 
          v-model="listingForm.platformDeposit"
          :precision="2"
          :step="0.1"
          :min="0">
        </el-input-number>
      </el-form-item>

      <el-form-item label="上架日期" prop="listingDate">
        <el-date-picker
          v-model="listingForm.listingDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD">
        </el-date-picker>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="listingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitListingForm">确定</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script setup>
import { ref, reactive, onMounted,computed ,nextTick, watch} from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表格数据
const searchQuery = ref('')
const statusFilter = ref('')
const tableData = ref([])
const sourceOptions = ref([])
// 添加 currentId 的定义
const currentId = ref(null)
// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

// 表单数据
const form = ref({
  accountNumber: '',
  password: '',
  purchaseSource: '',
  purchaseDate: '',
  purchasePrice: 0,
  comment: ''
})

// 上架相关
const listingDialogVisible = ref(false)
const listingFormRef = ref(null)
const currentAccount = ref(null)
const listingForm = ref({
  sellPlatform: '',
  sellPrice: 0,
  platformDeposit: 0,
  listingDate: new Date().toISOString().split('T')[0],  // 默认今天
  comment: ''

})
const listingRules = {
  sellPlatform: [
    { required: true, message: '请输入出售平台', trigger: 'blur' }
  ],
  sellPrice: [
    { required: true, message: '请输入出售价格', trigger: 'blur' }
  ],
  platformDeposit: [
    { required: true, message: '请输入平台保证金', trigger: 'blur' }
  ],
  listingDate: [
    { required: true, message: '请选择上架日期', trigger: 'change' }
  ]
}

const filteredTableData = computed(() => {
  if (!searchQuery.value) return tableData.value
  
  const query = searchQuery.value.toLowerCase()
  return tableData.value.filter(item => {
    return (
      item.accountNumber?.toLowerCase().includes(query) ||
      item.purchaseSource?.toLowerCase().includes(query) ||
      item.password?.toLowerCase().includes(query)
    )
  })
})
// 显示上架对话框
const handleListing = (row) => {
  currentAccount.value = row
  // 重置表单数据
  listingForm.value = {
    sellPlatform: '',
    sellPrice: 0,
    platformDeposit: 0,
    listingDate: new Date().toISOString().split('T')[0],
    comment: ''
  }
  listingDialogVisible.value = true
}
// 提交上架表单
const submitListingForm = async () => {
  if (!listingFormRef.value) return
  
  try {
    await listingFormRef.value.validate()
    
    // 构建更新数据
    const updateData = {
      id: currentAccount.value.id,
      status: 'listed',  // 更新状态为已上架
      ...listingForm.value
    }
    
    console.log('上架数据:', updateData)
    await window.electron.ipcRenderer.updateAccountListing(updateData)
    
    ElMessage.success('上架成功')
    listingDialogVisible.value = false
    await loadAccounts()  // 重新加载列表
  } catch (error) {
    if (error === 'cancel') return
    console.error('上架失败:', error)
    ElMessage.error('上架失败: ' + error.message)
  }
}
// 加载来源选项
const loadSourceOptions = async () => {
  try {
    const sources = await window.electron.ipcRenderer.getAllSources()
    sourceOptions.value = sources.map(source => ({
      label: source.name,
      value: source.name
    }))
  } catch (error) {
    console.error('加载来源选项失败:', error)
    ElMessage.error('加载来源选项失败')
  }
}
// 表单验证规则
const rules = {
  accountNumber: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  purchaseSource: [
    { required: true, message: '请选择来源', trigger: 'change' }
  ],
  purchaseDate: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  purchasePrice: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  comment: [
    { required: true, message: '请输入备注', trigger: 'blur' }
  ]
}

// 修改加载账号的方法，只显示未上架的账号
const loadAccounts = async () => {
  try {
    const accounts = await window.electron.ipcRenderer.getAllAccounts()
    tableData.value = accounts.filter(account => account.status === 'in_stock')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 方法
const showAddDialog = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}
// 编辑处理
const handleEdit = (row) => {
  console.log('编辑的行数据:', row) // 添加日志
  dialogType.value = 'edit'
  currentId.value = row.id
  // 直接赋值
  form.value = {
    accountNumber: row.accountNumber || '',
    password: row.password || '',
    purchaseSource: row.purchaseSource || '',
    purchaseDate: row.purchaseDate || '',
    purchasePrice: row.purchasePrice || null,
    comment: row.comment || ''
  }
  console.log('设置后的表单数据:', form.value) // 添加日志
  dialogVisible.value = true
}

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
    await loadAccounts()  // 重新加载数据
  } catch (error) {
    if (error !== 'cancel') {  // 用户取消不显示错误
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    if (dialogType.value === 'add') {
      // 修改：使用 form.value 来访问响应式对象的值
      await window.electron.ipcRenderer.addAccount({
        accountNumber: form.value.accountNumber,
        password: form.value.password,
        purchaseSource: form.value.purchaseSource,
        purchaseDate: form.value.purchaseDate,
        purchasePrice: form.value.purchasePrice,
        comment: form.value.comment,
        status: 'in_stock'  // 添加状态字段
      })
      
      ElMessage.success('添加成功')
      await loadAccounts()
    } else {
      // 编辑时包含 id
      const updateData = {
        id: currentId.value,
        ...form.value
      }
      console.log('更新的数据:', updateData)
      await window.electron.ipcRenderer.updateAccount(updateData)
      ElMessage.success('更新成功')
      await loadAccounts()
    }
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    accountNumber: '',
    password: '',
    purchaseSource: '',
    purchaseDate: '',
    purchasePrice: 0,
    comment: ''
  })
}
// 监听表格数据变化
watch(tableData, (newValue) => {
  console.log('表格数据发生变化:', newValue)
}, { deep: true })

// 监听对话框关闭
watch(dialogVisible, async (newValue, oldValue) => {
  if (!newValue && oldValue) {
    console.log('对话框关闭，重新加载数据')
    await loadAccounts()
  }
})
// 在组件挂载时加载数据
onMounted(async () => {
  console.log('组件挂载，开始加载数据')
  await loadAccounts()
  await loadSourceOptions()
})
</script>

<style scoped>
.stock-in-container {
  height: 100%;  /* 使容器占满整个高度 */
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.stock-list-card {
  flex: 1;  /* 使卡片占满剩余空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden;  /* 防止内容溢出 */
}

.stock-list-card :deep(.el-card__body) {
  flex: 1;  /* 使卡片体占满剩余空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.card-header h2 {
  margin: 0;
  color: #409EFF;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  padding: 0 10px;
}

.search-input {
  width: 300px;
}

.table-container {
  flex: 1;  /* 使表格容器占满剩余空间 */
  overflow: hidden;  /* 防止内容溢出 */
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

/* 调整表格样式 */
:deep(.el-table) {
  height: 100%;  /* 使表格占满容器高度 */
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}

:deep(.el-table__row) {
  height: 50px;  /* 设置行高 */
}

/* 确保滚动条样式美观 */
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