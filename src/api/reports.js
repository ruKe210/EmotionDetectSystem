import service from './request';

// 报表统计接口
export const reportsApi = {
  // 获取报表摘要
  getSummary: (params) => {
    return service.get('/reports/summary', { params });
  },

  // 获取情绪分布
  getEmotionDistribution: (params) => {
    return service.get('/reports/emotion-distribution', { params });
  },

  // 获取每小时统计
  getHourlyStats: (params) => {
    return service.get('/reports/hourly', { params });
  },

  // 获取趋势数据
  getTrend: (params) => {
    return service.get('/reports/trend', { params });
  },

};
