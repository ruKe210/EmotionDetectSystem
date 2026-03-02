import axios from 'axios';

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 基础URL
  timeout: 10000, // 超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从本地存储获取token
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
      // 处理错误状态
      console.error('响应错误:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;
  },
  error => {
    console.error('响应错误:', error);
    // 提取后端返回的错误信息
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