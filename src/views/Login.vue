<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>库存管理系统</h2>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        size="large">
        
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            :prefix-icon="User">
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin">
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

// 初始化登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: localStorage.getItem('savedRemember') === 'true' || false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 加载保存的登录信息
const loadSavedLoginInfo = () => {
  const savedUsername = localStorage.getItem('savedUsername')
  const savedPassword = localStorage.getItem('savedPassword')
  const savedRemember = localStorage.getItem('savedRemember') === 'true'
  
  if (savedRemember && savedUsername && savedPassword) {
    loginForm.username = savedUsername
    loginForm.password = savedPassword
    loginForm.remember = true
  }
}

// 保存登录信息
const saveLoginInfo = () => {
  if (loginForm.remember) {
    localStorage.setItem('savedUsername', loginForm.username)
    localStorage.setItem('savedPassword', loginForm.password)
    localStorage.setItem('savedRemember', 'true')
  } else {
    localStorage.removeItem('savedUsername')
    localStorage.removeItem('savedPassword')
    localStorage.removeItem('savedRemember')
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 这里是模拟的登录验证，实际应该调用后端API
    if (loginForm.username === 'admin' && loginForm.password === 'admin') {
      // 保存登录信息（如果选择了记住密码）
      saveLoginInfo()
      
      // 设置登录状态
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', loginForm.username)
      
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 组件加载时读取保存的登录信息
onMounted(() => {
  loadSavedLoginInfo()
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  background: url(../assets/background.jpg) no-repeat;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {
  width: 400px;
}

.login-card :deep(.el-card__header) {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.login-card h2 {
  margin: 0;
}

.login-button {
  width: 100%;
}

/* 添加过渡动画 */
.login-card {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 优化输入框样式 */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF;
}

/* 优化复选框样式 */
:deep(.el-checkbox__label) {
  color: #606266;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}
</style>