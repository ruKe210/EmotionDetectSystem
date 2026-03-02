import service from './request';

// 日志管理接口
export const logsApi = {
  // 获取日志列表
  getLogs: (params) => {
    return service.get('/logs', { params });
  },

  // 导出日志
  exportLogs: (params) => {
    return service.get('/logs/export', { params });
  },

  // 清空日志
  clearLogs: () => {
    return service.post('/logs/clear');
  },
};
