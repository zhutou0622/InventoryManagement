<template>
    <div class="source-manage-container">
      <el-card class="source-list-card">
        <template #header>
          <div class="card-header">
            <h2>来源管理</h2>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>添加来源
            </el-button>
          </div>
        </template>
  
        <!-- 来源列表 -->
        <el-table :data="sourceList" style="width: 100%">
          <el-table-column prop="name" label="来源名称" width="180" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="danger" link @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 添加来源对话框 -->
      <el-dialog
        v-model="dialogVisible"
        title="添加来源"
        width="500px">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px">
          
          <el-form-item label="来源名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入来源名称"></el-input>
          </el-form-item>
  
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              placeholder="请输入描述">
            </el-input>
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
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  const sourceList = ref([])
  const dialogVisible = ref(false)
  const formRef = ref(null)
  
  const form = reactive({
    name: '',
    description: ''
  })
  
  const rules = {
    name: [
      { required: true, message: '请输入来源名称', trigger: 'blur' }
    ]
  }
  
  // 加载来源列表
  const loadSources = async () => {
    try {
      const sources = await window.electron.ipcRenderer.getAllSources()
      sourceList.value = sources
    } catch (error) {
      console.error('加载来源列表失败:', error)
      ElMessage.error('加载来源列表失败')
    }
  }
  
  // 显示添加对话框
  const showAddDialog = () => {
    form.name = ''
    form.description = ''
    dialogVisible.value = true
  }
  
  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return
    
    try {
      await formRef.value.validate()
      await window.electron.ipcRenderer.addSource({
        name: form.name,
        description: form.description
      })
      
      ElMessage.success('添加成功')
      dialogVisible.value = false
      await loadSources()
    } catch (error) {
      console.error('添加来源失败:', error)
      ElMessage.error('添加失败')
    }
  }
  
  // 删除来源
  const handleDelete = async (row) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除来源 ${row.name} 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await window.electron.ipcRenderer.deleteSource(row.id)
      ElMessage.success('删除成功')
      await loadSources()
    } catch (error) {
      if (error === 'cancel') return
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
  
  onMounted(() => {
    loadSources()
  })
  </script>
  
  <style scoped>
  .source-manage-container {
    padding: 20px;
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
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  </style>