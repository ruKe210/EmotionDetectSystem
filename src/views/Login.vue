<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            <path d="M18 8c1.1 0 2 .9 2 2s-.9 2-2 2"/>
            <path d="M6 8c-1.1 0-2 .9-2 2s.9 2 2 2"/>
          </svg>
        </div>
        <h2>情绪识别系统</h2>
        <p>欢迎回来，请登录您的账户</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
          />
          <span v-if="errors.username" class="error-msg">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
          <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
        </div>

        <div class="login-options">
          <label class="remember-me">
            <input type="checkbox" v-model="remember" />
            <span>记住我</span>
          </label>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>登录</span>
        </button>
      </form>
    </div>

    <!-- 装饰元素 -->
    <div class="decoration decoration-1"></div>
    <div class="decoration decoration-2"></div>
    <div class="decoration decoration-3"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSystemStore } from '../store/modules/systemStore'
import { authApi } from '../api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const systemStore = useSystemStore()

const username = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const errors = ref({ username: '', password: '' })

const validate = () => {
  errors.value = { username: '', password: '' }
  let valid = true
  if (!username.value.trim()) {
    errors.value.username = '请输入用户名'
    valid = false
  }
  if (!password.value) {
    errors.value.password = '请输入密码'
    valid = false
  }
  return valid
}

const handleLogin = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const res = await authApi.login({
      username: username.value.trim(),
      password: password.value
    })
    const { token, user } = res.data
    systemStore.setUser({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      token
    })
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '用户名或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #fafbfd 0%, #f5f8ff 50%, #f8fcfa 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  pointer-events: none;
}
.decoration-1 {
  width: 400px; height: 400px;
  background: linear-gradient(135deg, #7c9ff5, #c5b3e6);
  top: -200px; right: -100px;
  animation: float 20s infinite ease-in-out;
}
.decoration-2 {
  width: 300px; height: 300px;
  background: linear-gradient(135deg, #5fd4c8, #a8d5ba);
  bottom: -150px; left: -100px;
  animation: float 15s infinite ease-in-out reverse;
}
.decoration-3 {
  width: 200px; height: 200px;
  background: linear-gradient(135deg, #ff9a8b, #ffc3a0);
  top: 50%; right: 10%;
  animation: float 18s infinite ease-in-out;
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(10deg); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(124, 159, 245, 0.12);
  border: 1px solid rgba(124, 159, 245, 0.1);
  padding: 48px 40px;
  max-width: 420px;
  width: 100%;
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-icon {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #7c9ff5, #c5b3e6);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(124, 159, 245, 0.25);
}
.login-icon svg { width: 32px; height: 32px; stroke: white; }
.login-header h2 {
  color: #3d4852; margin-bottom: 8px;
  font-weight: 600; font-size: 24px;
}
.login-header p {
  color: #9ca3af; font-size: 14px; margin: 0;
}

.login-form { display: flex; flex-direction: column; gap: 20px; }

.form-group {
  display: flex; flex-direction: column; gap: 6px;
}
.form-group label {
  font-size: 13px; font-weight: 600; color: #4b5563;
}
.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid rgba(124, 159, 245, 0.15);
  border-radius: 12px;
  font-size: 14px;
  color: #3d4852;
  background: #fff;
  outline: none;
  transition: all 0.3s ease;
}
.form-group input:hover {
  border-color: rgba(124, 159, 245, 0.3);
}
.form-group input:focus {
  border-color: #7c9ff5;
  box-shadow: 0 0 0 4px rgba(124, 159, 245, 0.08);
}
.error-msg {
  font-size: 12px; color: #ff6b6b;
}

.login-options {
  display: flex; align-items: center;
}
.remember-me {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #6b7280; cursor: pointer;
}
.remember-me input[type="checkbox"] {
  accent-color: #7c9ff5;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-weight: 600; font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #7c9ff5, #c5b3e6);
  border: none; border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(124, 159, 245, 0.3);
  transition: all 0.3s ease;
  display: flex; align-items: center; justify-content: center;
  min-height: 48px;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 159, 245, 0.4);
}
.login-btn:active:not(:disabled) { transform: translateY(0); }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .login-card { padding: 36px 28px; border-radius: 20px; }
  .login-header h2 { font-size: 22px; }
  .decoration { display: none; }
}
</style>