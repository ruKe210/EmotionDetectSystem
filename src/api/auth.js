import service from './request';

// 认证相关接口
export const authApi = {
  // 登录
  login: (data) => {
    return service.post('/auth/login', data);
  },

  // 登出
  logout: () => {
    return service.post('/auth/logout');
  },

  // 刷新令牌
  refresh: () => {
    return service.post('/auth/refresh');
  },
};
