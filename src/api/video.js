import service from './request';

export const videoApi = {
  getVideoList: (params) => service.get('/video/list', { params }),
  getVideoFaces: (params) => service.get('/video/faces', { params }),
};
