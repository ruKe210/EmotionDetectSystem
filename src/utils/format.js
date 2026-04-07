/**
 * 格式化工具函数
 */

/**
 * 格式化时间
 * @param {number|Date} timestamp - 时间戳或日期对象
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds);
}

/**
 * 格式化毫秒级时间戳
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp(timestamp) {
  return formatTime(timestamp, 'YYYY-MM-DD HH:mm:ss.SSS');
}

/**
 * 格式化数值
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @param {string} thousandsSeparator - 千位分隔符
 * @param {string} decimalSeparator - 小数分隔符
 * @returns {string} 格式化后的数值字符串
 */
export function formatNumber(value, decimals = 2, thousandsSeparator = ',', decimalSeparator = '.') {
  if (isNaN(value)) return '0';
  
  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  return parts.join(decimalSeparator);
}

/**
 * 格式化百分比
 * @param {number} value - 小数值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(value, decimals = 1) {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小字符串
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的持续时间字符串
 */
export function formatDuration(seconds) {
  if (isNaN(seconds)) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * 格式化IP地址
 * @param {string} ip - IP地址
 * @returns {string} 格式化后的IP地址
 */
export function formatIP(ip) {
  if (!ip) return '0.0.0.0';
  return ip;
}

/**
 * 格式化MAC地址
 * @param {string} mac - MAC地址
 * @returns {string} 格式化后的MAC地址
 */
export function formatMAC(mac) {
  if (!mac) return '00:00:00:00:00:00';
  return mac.toUpperCase().replace(/(.{2})/g, '$1:').slice(0, -1);
}

/**
 * 格式化情绪名称
 * @param {string} emotion - 情绪英文名称
 * @returns {string} 情绪中文名称
 */
export function formatEmotion(emotion) {
  const emotionMap = {
    neutral: '中性',
    happy: '开心',
    sad: '悲伤',
    angry: '愤怒',
    fearful: '恐惧',
    disgusted: '厌恶',
    surprised: '惊讶',
    contempt: '蔑视'
  };
  return emotionMap[emotion] || emotion;
}

/**
 * 格式化错误信息
 * @param {Error|string} error - 错误对象或错误信息
 * @returns {string} 格式化后的错误信息
 */
export function formatError(error) {
  if (error instanceof Error) {
    return error.message || '未知错误';
  }
  return String(error) || '未知错误';
}

/**
 * 格式化状态
 * @param {string} status - 状态值
 * @returns {object} 状态对象，包含文本和颜色
 */
export function formatStatus(status) {
  const statusMap = {
    online: { text: '在线', color: 'success' },
    offline: { text: '离线', color: 'danger' },
    warning: { text: '警告', color: 'warning' },
    error: { text: '错误', color: 'danger' },
    success: { text: '成功', color: 'success' },
    pending: { text: '待处理', color: 'info' },
    processing: { text: '处理中', color: 'info' }
  };
  return statusMap[status] || { text: status, color: 'info' };
}