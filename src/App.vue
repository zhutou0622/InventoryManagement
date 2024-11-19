<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  console.log('App mounted, login status:', isLoggedIn)
  
  if (!isLoggedIn) {
    console.log('未登录，重定向到登录页')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    router.push('/login')
  }
})
</script>

<template>
  <router-view />
</template>