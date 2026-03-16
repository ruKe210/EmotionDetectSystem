import axios from 'axios';
import router from '../router/index';

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code !== 200) {
      console.error('响应错误:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;
  },
  error => {
    console.error('响应错误:', error);

    // 401 未认证 → token 无效或过期，跳转登录
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userToken');
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
      return Promise.reject(new Error('请先登录'));
    }

    if (error.response && error.response.data) {
      const detail = error.response.data.detail || error.response.data.message;
      if (detail) {
        return Promise.reject(new Error(detail));
      }
    }
    return Promise.reject(error);
  }
);

export default service;
