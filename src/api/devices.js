import service from './request';

// 设备管理接口
export const devicesApi = {
  // 获取摄像头列表
  getCameraList: () => {
    return service.get('/camera/list');
  },

  // 获取摄像头详情
  getCamera: (cameraId) => {
    return service.get(`/camera/${cameraId}`);
  },

  // 创建摄像头
  createCamera: (data) => {
    return service.post('/camera', data);
  },

  // 更新摄像头
  updateCamera: (cameraId, data) => {
    return service.put(`/camera/${cameraId}`, data);
  },

  // 删除摄像头
  deleteCamera: (cameraId) => {
    return service.delete(`/camera/${cameraId}`);
  },

  // 切换摄像头状态
  toggleCamera: (cameraId) => {
    return service.post(`/camera/${cameraId}/toggle`);
  },
};
