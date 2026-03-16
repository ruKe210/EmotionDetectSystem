import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/TestPage.vue'),
    meta: { title: '控制台', requiresAuth: true }
  },
  {
    path: '/realtime',
    name: 'RealTime',
    component: () => import('../views/RealTimeRecog.vue'),
    meta: { title: '实时识别', requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryData.vue'),
    meta: { title: '历史记录', requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/ReportsPage.vue'),
    meta: { title: '统计报表', requiresAuth: true }
  },
  {
    path: '/config',
    name: 'Config',
    component: () => import('../views/SystemConfig.vue'),
    meta: { title: '系统配置', requiresAuth: true }
  },
  {
    path: '/device',
    name: 'Device',
    component: () => import('../views/DevicePage.vue'),
    meta: { title: '设备管理', requiresAuth: true }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/AlertsPage.vue'),
    meta: { title: '告警管理', requiresAuth: true }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/LogsPage.vue'),
    meta: { title: '日志管理', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersPage.vue'),
    meta: { title: '用户管理', requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' - 人脸情绪识别系统';
  }

  const token = localStorage.getItem('userToken');

  // 需要认证但没有 token → 跳转登录
  if (to.meta.requiresAuth && !token) {
    next('/login');
    return;
  }

  // 已登录但访问登录页 → 跳转首页
  if (to.path === '/login' && token) {
    next('/');
    return;
  }

  next();
});

export default router;
