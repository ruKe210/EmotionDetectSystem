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
      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
            size="large"
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            size="large"
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <a href="#" class="forgot-password">忘记密码?</a>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            size="large"
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 装饰元素 -->
    <div class="decoration decoration-1"></div>
    <div class="decoration decoration-2"></div>
    <div class="decoration decoration-3"></div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSystemStore } from '../store/modules/systemStore';
import { authApi } from '../api/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const systemStore = useSystemStore();

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

const loading = ref(false);

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
};

const handleLogin = async () => {
  loading.value = true;

  try {
    const res = await authApi.login({
      username: loginForm.username,
      password: loginForm.password
    });

    const { token, user } = res.data;

    // 存储用户信息
    systemStore.setUser({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      token: token
    });

    ElMessage.success('登录成功');
    
    // 跳转到首页
    router.push('/');
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error(error.message || '用户名或密码错误');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #fafbfd 0%, #f5f8ff 50%, #f8fcfa 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 装饰元素 */
.decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  pointer-events: none;
}

.decoration-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #7c9ff5 0%, #c5b3e6 100%);
  top: -200px;
  right: -100px;
  animation: float 20s infinite ease-in-out;
}

.decoration-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #5fd4c8 0%, #a8d5ba 100%);
  bottom: -150px;
  left: -100px;
  animation: float 15s infinite ease-in-out reverse;
}

.decoration-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #ff9a8b 0%, #ffc3a0 100%);
  top: 50%;
  right: 10%;
  animation: float 18s infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-30px) rotate(10deg);
  }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
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
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #7c9ff5 0%, #c5b3e6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(124, 159, 245, 0.25);
  animation: iconPulse 2s infinite ease-in-out;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(124, 159, 245, 0.25);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(124, 159, 245, 0.35);
  }
}

.login-icon svg {
  width: 32px;
  height: 32px;
  stroke: white;
}

.login-header h2 {
  color: #3d4852;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 0;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: none;
  border: 1.5px solid rgba(124, 159, 245, 0.15);
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(124, 159, 245, 0.3);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(124, 159, 245, 0.08);
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  color: #3d4852;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
  font-weight: 400;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-options :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.forgot-password {
  color: var(--primary);
  font-size: 13px;
  text-decoration: none;
  transition: all 0.3s;
  font-weight: 500;
}

.forgot-password:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-weight: 600;
  font-size: 15px;
  background: linear-gradient(135deg, #7c9ff5 0%, #c5b3e6 100%);
  border: none;
  border-radius: 12px;
  letter-spacing: -0.2px;
  box-shadow: 0 4px 16px rgba(124, 159, 245, 0.3);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 159, 245, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .login-card {
    padding: 36px 28px;
    border-radius: 20px;
  }
  
  .login-header h2 {
    font-size: 22px;
  }
  
  .decoration {
    display: none;
  }
}
</style>
