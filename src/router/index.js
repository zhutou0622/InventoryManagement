import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
        path: '/dashboard',
        component: () => import('../views/Dashboard.vue'),
        children: [
          {
            path: '',
            name: 'DashboardHome',
            component: () => import('../views/DashboardHome.vue'),  // 确保这个组件存在
            meta: { requiresAuth: true }
          },
          {
            path: 'stock-in',
            name: 'StockIn',
            component: () => import('../views/StockIn.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'source',
            name: 'SourceManage',
            component: () => import('../views/SourceManage.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'listed-accounts',
            name: 'ListedAccounts',
            component: () => import('../views/ListedAccounts.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'sold-accounts',
            name: 'SoldAccounts',
            component: () => import('../views/SoldAccounts.vue'),
            meta: { requiresAuth: true }
          }
        ],
        meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  console.log('当前登录状态:', isLoggedIn)  // 添加日志

  if (to.path === '/login' && isLoggedIn) {
    next('/dashboard')
    return
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !isLoggedIn) {
    console.log('需要登录，重定向到登录页')  // 添加日志
    next('/login')
    return
  }

  next()
})

export default router