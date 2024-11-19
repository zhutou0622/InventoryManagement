<template>
    <el-container class="layout-container">
      <el-aside width="200px">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b">
          
          <el-menu-item index="/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
  
          <el-menu-item index="/dashboard/stock-in">
            <el-icon><Plus /></el-icon>
            <span>账号入库</span>
          </el-menu-item>
  
        
  
          <el-menu-item index="/dashboard/listed-accounts">
            <el-icon><List /></el-icon>
            <span>上架账号</span>
          </el-menu-item>
  
          <el-menu-item index="/dashboard/sold-accounts">
            <el-icon><Money /></el-icon>
            <span>已售账号</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/source">
            <el-icon><Setting /></el-icon>
            <span>来源管理</span>
          </el-menu-item>
          <el-menu-item index="/logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
  
      <el-container>
        <el-header>
          <div class="header-content">
            <h2>库存管理系统</h2>
            <span class="username">{{ username }}</span>
          </div>
        </el-header>
        
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {
    DataLine,
    Plus,
    Setting,
    List,
    Money,
    SwitchButton
  } from '@element-plus/icons-vue'
  
  const router = useRouter()
  const route = useRoute()
  const username = ref(localStorage.getItem('username') || '')
  
  const activeMenu = computed(() => route.path)
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .layout-container {
    height: 100vh;
    width: 100vw;
  }
  
  .el-aside {
    background-color: #545c64;
    color: white;
    height: 100vh;
  }
  
  .el-header {
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .header-content h2 {
    margin: 0;
    color: #409EFF;
  }
  
  .username {
    color: #606266;
  }
  
  .el-main {
    padding: 0;
    height: calc(100vh - 60px);
    overflow: hidden;
  }
  
  .el-menu-vertical {
    border-right: none;
  }
  
  .el-menu-item {
    display: flex;
    align-items: center;
  }
  
  .el-icon {
    margin-right: 8px;
  }
  </style>