import service from './request';

// 人脸相关接口
export const faceApi = {
  // 查询单人脸详情
  getFaceDetail: (faceId) => {
    return service.get(`/face/${faceId}`);
  },
  
  // 获取全局统计数据
  getGlobalStats: () => {
    return service.get('/face/stats');
  },
  
  // 获取实时人脸数据
  getRealTimeData: () => {
    return service.get('/face/realtime');
  },
  
  // 获取历史情绪数据
  getEmotionHistory: (params) => {
    return service.get('/face/history', { params });
  },
  
  // 初始化WebSocket连接
  initWS: (callback) => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/face`);
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('WebSocket消息解析失败:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      // 可以实现重连逻辑
      setTimeout(() => {
        faceApi.initWS(callback);
      }, 3000);
    };
    
    return ws;
  }
};