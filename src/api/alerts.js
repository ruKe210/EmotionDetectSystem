import service from './request';

// 告警管理接口
export const alertsApi = {
  // 获取告警列表
  getAlerts: (params) => {
    return service.get('/alerts', { params });
  },

  // 获取告警详情
  getAlert: (alertId) => {
    return service.get(`/alerts/${alertId}`);
  },

  // 处理告警
  handleAlert: (alertId) => {
    return service.post(`/alerts/${alertId}/handle`);
  },

  // 忽略告警
  ignoreAlert: (alertId) => {
    return service.post(`/alerts/${alertId}/ignore`);
  },

  // 批量处理告警
  batchHandle: (ids) => {
    return service.post('/alerts/batch/handle', { ids });
  },
};
