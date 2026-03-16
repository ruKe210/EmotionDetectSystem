<template>
  <div class="layout">
    <aside v-show="showLayout" class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            <path d="M18 8c1.1 0 2 .9 2 2s-.9 2-2 2"/>
            <path d="M6 8c-1.1 0-2 .9-2 2s.9 2 2 2"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-title">情绪识别</span>
          <span class="logo-sub">智能分析系统</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
        >
          <div class="nav-icon" v-html="item.icon"></div>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div class="user-info">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-role">{{ displayRole }}</span>
        </div>
        <button class="logout-btn" @click="logout" aria-label="退出登录">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <div :class="showLayout ? 'main-wrapper' : 'main-full'">
      <header v-show="showLayout" class="topbar">
        <div class="topbar-left">
          <div class="breadcrumb">
            <span class="breadcrumb-home">首页</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="breadcrumb-sep">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span class="breadcrumb-current">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-time">{{ clock }}</div>
          <div class="topbar-status">
            <span class="status-dot"></span>
            <span>系统正常</span>
          </div>
          <div class="topbar-notify">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notify-badge">3</span>
          </div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ displayName.charAt(0) }}</div>
            <span>{{ systemStore.user.username || 'Admin' }}</span>
          </div>
        </div>
      </header>

      <main :class="showLayout ? 'page-content' : ''">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSystemStore } from './store/modules/systemStore'

const route = useRoute()
const router = useRouter()
const systemStore = useSystemStore()

// --- 时钟 ---
const clock = ref('')
let timerId = null
const tick = () => {
  const d = new Date()
  clock.value = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
}
onMounted(() => { tick(); timerId = setInterval(tick, 1000) })
onBeforeUnmount(() => clearInterval(timerId))

// --- 布局控制 ---
const showLayout = computed(() => route.path !== '/login')

const displayName = computed(() => systemStore.user.name || '用户')
const displayRole = computed(() => {
  const map = { admin: '管理员', user: '操作员', viewer: '查看员' }
  return map[systemStore.user.role] || systemStore.user.role || ''
})

const titles = {
  '/': '控制台', '/realtime': '实时识别', '/history': '历史记录',
  '/reports': '统计报表', '/config': '系统配置', '/device': '设备管理',
  '/alerts': '告警管理', '/logs': '日志管理', '/users': '用户管理'
}
const pageTitle = computed(() => titles[route.path] || '控制台')

const logout = () => { systemStore.clearUser(); router.push('/login') }

// --- 导航项 ---
const navItems = [
  { path: '/', label: '控制台', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { path: '/realtime', label: '实时检测', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>` },
  { path: '/history', label: '历史记录', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { path: '/reports', label: '统计报表', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  { path: '/device', label: '设备管理', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
  { path: '/alerts', label: '告警管理', badge: '3', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
  { path: '/logs', label: '日志管理', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>` },
  { path: '/users', label: '用户管理', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { path: '/config', label: '系统配置', badge: null, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41"/></svg>` },
]
</script>

<style scoped>
.main-full {
  width: 100%;
  min-height: 100vh;
}
</style>