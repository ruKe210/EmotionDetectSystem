import { defineStore } from 'pinia';

// 系统相关状态管理
export const useSystemStore = defineStore('system', {
  state: () => ({
    // 用户信息
    user: {
      id: null,
      username: '',
      name: '',
      role: '',
      email: '',
      token: null
    },
    // 系统运行状态
    systemStatus: {
      isOnline: true,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      uptime: 0,
      activeConnections: 0
    },
    // 设备列表
    devices: [],
    // 告警列表
    alerts: [],
    // 日志列表
    logs: [],
    // 系统配置
    config: {
      apiBaseUrl: '/api',
      wsBaseUrl: 'ws://localhost:8000',
      maxDetectFaces: 10,
      defaultCameraId: '',
      theme: 'default'
    },
    // 加载状态
    loading: {
      global: false,
      api: false,
      data: false
    },
    // 错误信息
    error: {
      global: null,
      api: null,
      data: null
    },
    // 通知列表
    notifications: []
  }),
  
  getters: {
    // 当前用户
    currentUser: (state) => {
      return state.user.id ? state.user : null;
    },
    
    // 是否登录
    isLoggedIn: (state) => {
      return !!state.user.token;
    },
    
    // 用户角色
    userRole: (state) => {
      return state.user.role || 'viewer';
    },
    
    // 是否管理员
    isAdmin: (state) => {
      return state.user.role === 'admin';
    },
    
    // 是否操作员
    isOperator: (state) => {
      return state.user.role === 'operator' || state.user.role === 'admin';
    },
    
    // 系统健康状态
    systemHealth: (state) => {
      const { cpuUsage, memoryUsage } = state.systemStatus;
      if (cpuUsage > 80 || memoryUsage > 80) {
        return 'danger';
      } else if (cpuUsage > 60 || memoryUsage > 60) {
        return 'warning';
      }
      return 'healthy';
    },
    
    // 未处理的告警数量
    unhandledAlertsCount: (state) => {
      return state.alerts.filter(alert => alert.status === 'unhandled').length;
    },
    
    // 在线设备数量
    onlineDevicesCount: (state) => {
      return state.devices.filter(device => device.status === 'online').length;
    }
  },
  
  actions: {
    // 设置当前用户
    setCurrentUser(user) {
      if (user) {
        this.user = { ...this.user, ...user };
        if (user.token) {
          localStorage.setItem('userToken', user.token);
        }
      } else {
        this.clearUser();
      }
    },
    
    // 设置用户信息
    setUser(user) {
      this.user = { ...this.user, ...user };
      // 保存到本地存储
      if (user.token) {
        localStorage.setItem('userToken', user.token);
      }
      // 持久化用户信息（不含 token）
      const { token, ...userInfo } = this.user;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    
    // 清除用户信息
    clearUser() {
      this.user = {
        id: null,
        username: '',
        name: '',
        role: '',
        email: '',
        token: null
      };
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
    },
    
    // 更新系统状态
    updateSystemStatus(status) {
      this.systemStatus = { ...this.systemStatus, ...status };
    },
    
    // 更新设备列表
    updateDevices(devices) {
      this.devices = devices;
    },
    
    // 添加设备
    addDevice(device) {
      this.devices.push(device);
    },
    
    // 更新设备状态
    updateDeviceStatus(deviceId, status) {
      const device = this.devices.find(d => d.id === deviceId);
      if (device) {
        device.status = status;
      }
    },
    
    // 删除设备
    removeDevice(deviceId) {
      this.devices = this.devices.filter(d => d.id !== deviceId);
    },
    
    // 更新告警列表
    updateAlerts(alerts) {
      this.alerts = alerts;
    },
    
    // 添加告警
    addAlert(alert) {
      this.alerts.unshift(alert);
      // 限制告警数量
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(0, 100);
      }
    },
    
    // 更新告警状态
    updateAlertStatus(alertId, status) {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = status;
      }
    },
    
    // 更新日志列表
    updateLogs(logs) {
      this.logs = logs;
    },
    
    // 添加日志
    addLog(log) {
      this.logs.unshift(log);
      // 限制日志数量
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(0, 1000);
      }
    },
    
    // 更新系统配置
    updateConfig(config) {
      this.config = { ...this.config, ...config };
      // 保存到本地存储
      localStorage.setItem('systemConfig', JSON.stringify(this.config));
    },
    
    // 加载系统配置
    loadConfig() {
      const savedConfig = localStorage.getItem('systemConfig');
      if (savedConfig) {
        try {
          this.config = JSON.parse(savedConfig);
        } catch (error) {
          console.error('加载配置失败:', error);
        }
      }
    },
    
    // 设置加载状态
    setLoading(type, status) {
      this.loading[type] = status;
    },
    
    // 设置错误信息
    setError(type, error) {
      this.error[type] = error;
    },
    
    // 清除错误信息
    clearError(type) {
      this.error[type] = null;
    },
    
    // 添加通知
    addNotification(notification) {
      this.notifications.unshift({
        id: Date.now(),
        timestamp: new Date(),
        ...notification
      });
      // 限制通知数量
      if (this.notifications.length > 20) {
        this.notifications = this.notifications.slice(0, 20);
      }
    },
    
    // 移除通知
    removeNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
    },
    
    // 清除所有通知
    clearNotifications() {
      this.notifications = [];
    },
    
    // 初始化系统
    initSystem() {
      // 加载用户token
      const token = localStorage.getItem('userToken');
      if (token) {
        this.user.token = token;
      }

      // 恢复用户信息
      const savedUser = localStorage.getItem('userInfo');
      if (savedUser) {
        try {
          const userInfo = JSON.parse(savedUser);
          this.user = { ...this.user, ...userInfo, token: this.user.token };
        } catch (e) {
          console.error('恢复用户信息失败:', e);
        }
      }
      
      // 加载系统配置
      this.loadConfig();
    }
  }
});