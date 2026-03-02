import service from './request';

// 用户管理接口
export const usersApi = {
  // 获取用户列表
  getUsers: (params) => {
    return service.get('/users', { params });
  },

  // 创建用户
  createUser: (data) => {
    return service.post('/users', data);
  },

  // 更新用户
  updateUser: (userId, data) => {
    return service.put(`/users/${userId}`, data);
  },

  // 删除用户
  deleteUser: (userId) => {
    return service.delete(`/users/${userId}`);
  },

  // 更新用户状态
  updateUserStatus: (userId, status) => {
    return service.put(`/users/${userId}/status`, { status });
  },
};
