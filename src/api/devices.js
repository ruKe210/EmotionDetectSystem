import service from './request';

export const devicesApi = {
  getCameraList: () => service.get('/camera/list'),
  getCamera: (cameraId) => service.get(`/camera/${cameraId}`),
  createCamera: (data) => service.post('/camera', data),
  updateCamera: (cameraId, data) => service.put(`/camera/${cameraId}`, data),
  deleteCamera: (cameraId) => service.delete(`/camera/${cameraId}`),
  toggleCamera: (cameraId) => service.post(`/camera/${cameraId}/toggle`),

  // 局域网扫描
  scanNetwork: () => service.get('/camera/scan/network'),
  // 测试 RTSP 连接
  testRtsp: (data) => service.post('/camera/scan/test', data),
};
