<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-left">
        <div class="welcome-icon">🌸</div>
        <div>
          <div class="welcome-title">欢迎回来，{{ welcomeName }}</div>
          <div class="welcome-sub">{{ todayStr }} · 今天也是美好的一天</div>
        </div>
      </div>
      <div class="welcome-right">
        <div class="quick-action" @click="$router.push('/realtime')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          开始检测
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="(stat, i) in stats"
        :key="stat.key"
        class="stat-card"
        :style="{ animationDelay: i * 0.08 + 's' }"
      >
        <div class="stat-icon-wrap" :style="{ background: stat.gradient }">
          <div class="stat-icon" v-html="stat.icon"></div>
        </div>
        <div class="stat-info">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
          <div class="stat-trend" :class="stat.trendType">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="stat.trendType === 'up' ? '23 6 13.5 15.5 8.5 10.5 1 18' : '1 6 10.5 15.5 15.5 10.5 23 18'"/>
            </svg>
            {{ stat.trend }}
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="dashboard-grid">
      <!-- 实时监控 -->
      <div class="card monitor-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--green)"></span>
            实时监控
          </h4>
          <div class="live-badge">
            <span class="live-dot"></span>
            LIVE
          </div>
        </div>
        <div class="card-body">
          <div class="camera-grid">
            <div class="camera-item" v-for="cam in cameras" :key="cam.id" @click="goToRealtime(cam)" style="cursor:pointer" title="点击进入实时检测">
              <div class="camera-feed" :class="{ offline: cam.status !== 'online' }">
                <!-- 实时视频帧 -->
                <img
                  v-if="cam.status === 'online' && cam.frame"
                  :src="cam.frame"
                  class="camera-live-img"
                  alt="实时画面"
                />
                <!-- 离线或无画面时的占位 -->
                <div v-else class="camera-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span>{{ cam.status === 'online' ? '等待画面...' : '设备离线' }}</span>
                </div>
                <div class="camera-info-overlay">
                  <span class="camera-name">{{ cam.name }}</span>
                  <span class="camera-emotion" :class="cam.emotionClass">{{ cam.emotion }}</span>
                </div>
                <div class="camera-status-dot" :class="cam.status === 'online' ? 'online' : 'offline'"></div>
              </div>
            </div>
            <div v-if="cameras.length === 0" class="camera-item">
              <div class="camera-feed offline">
                <div class="camera-placeholder">
                  <span>暂无摄像头，请在设备管理中添加</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 情绪分布 -->
      <div class="card emotion-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--lavender)"></span>
            今日情绪分布
          </h4>
          <span class="card-date">今天</span>
        </div>
        <div class="card-body">
          <div class="emotion-bars">
            <div
              v-for="em in emotions"
              :key="em.name"
              class="emotion-bar-item"
            >
              <div class="emotion-bar-header">
                <span class="emotion-name">{{ em.emoji }} {{ em.name }}</span>
                <span class="emotion-pct">{{ em.pct }}%</span>
              </div>
              <div class="emotion-bar-track">
                <div
                  class="emotion-bar-fill"
                  :style="{ width: em.pct + '%', background: em.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近告警 -->
      <div class="card alerts-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--pink)"></span>
            最近告警
          </h4>
          <a class="view-all" @click="$router.push('/alerts')">查看全部 →</a>
        </div>
        <div class="card-body">
          <div class="alert-list">
            <div
              v-for="alert in recentAlerts"
              :key="alert.id"
              class="alert-item"
              :class="alert.level"
            >
              <div class="alert-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-time">{{ alert.time }} · {{ alert.device }}</div>
              </div>
              <span class="badge" :class="alert.badgeClass">{{ alert.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 识别趋势 -->
      <div class="card trend-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--mint)"></span>
            今日识别趋势
          </h4>
        </div>
        <div class="card-body">
          <div class="mini-chart">
            <div
              v-for="(bar, i) in trendData"
              :key="i"
              class="mini-bar"
              :style="{ height: bar.height + '%' }"
              :title="bar.label + ': ' + bar.value"
            >
              <div class="mini-bar-fill" :style="{ background: bar.color }"></div>
              <span class="mini-bar-label">{{ bar.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { faceApi } from '../api/face';
import { devicesApi } from '../api/devices';
import { alertsApi } from '../api/alerts';
import { reportsApi } from '../api/reports';
import { useSystemStore } from '../store/modules/systemStore';

const router = useRouter();
const systemStore = useSystemStore();

const today = new Date();
const todayStr = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日 ${days[today.getDay()]}`;
});

const welcomeName = computed(() => systemStore.user.name || '管理员');

const stats = ref([
  {
    key: 'devices',
    label: '在线设备',
    value: '- / -',
    valueClass: 'value-primary',
    trend: '加载中...',
    trendType: 'neutral',
    gradient: 'linear-gradient(135deg, #6c8ef0, #a29bfe)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`
  },
  {
    key: 'recognition',
    label: '今日识别',
    value: '-',
    valueClass: 'value-mint',
    trend: '加载中...',
    trendType: 'neutral',
    gradient: 'linear-gradient(135deg, #00cec9, #00b894)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>`
  },
  {
    key: 'alerts',
    label: '今日告警',
    value: '-',
    valueClass: 'value-pink',
    trend: '加载中...',
    trendType: 'neutral',
    gradient: 'linear-gradient(135deg, #fd79a8, #e84393)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`
  },
  {
    key: 'accuracy',
    label: '识别准确率',
    value: '-',
    valueClass: 'value-yellow',
    trend: '加载中...',
    trendType: 'neutral',
    gradient: 'linear-gradient(135deg, #fdcb6e, #e17055)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>`
  }
]);

const cameras = ref([]);

// WebSocket 连接
let videoWs = null;
let faceWs = null;
let wsReconnectTimer = null;

const connectVideoWs = () => {
  if (videoWs) {
    videoWs.close();
    videoWs = null;
  }
  try {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    videoWs = new WebSocket(`${wsProtocol}//${wsHost}/ws/video`);

    videoWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'video' && message.frame) {
          const frameData = `data:image/jpeg;base64,${message.frame}`;
          // 按 camera_id 精确匹配，匹配不到则给第一个在线摄像头
          let cam = cameras.value.find(c => c.id === message.camera_id);
          if (!cam) cam = cameras.value.find(c => c.status === 'online' && !c.frame);
          if (!cam) cam = cameras.value.find(c => c.status === 'online');
          if (cam) cam.frame = frameData;
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    videoWs.onclose = () => {
      // 自动重连
      if (!wsReconnectTimer) {
        wsReconnectTimer = setTimeout(() => {
          wsReconnectTimer = null;
          connectVideoWs();
        }, 3000);
      }
    };

    videoWs.onerror = () => {
      // onclose 会处理重连
    };
  } catch (err) {
    console.error('视频WebSocket连接失败:', err);
  }
};

const connectFaceWs = () => {
  if (faceWs) {
    faceWs.close();
    faceWs = null;
  }
  try {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    faceWs = new WebSocket(`${wsProtocol}//${wsHost}/ws/face`);

    faceWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'face' && message.data && message.data.faces) {
          const faces = message.data.faces;
          const cameraId = message.data.camera_id;
          // 按 camera_id 匹配，匹配不到则给第一个在线摄像头
          let cam = cameras.value.find(c => c.id === cameraId);
          if (!cam) cam = cameras.value.find(c => c.status === 'online');
          if (cam && faces.length > 0) {
            const dominant = faces[0].dominant_emotion || 'neutral';
            const emoji = emotionEmojiMap[dominant] || '😐';
            const name = emotionNameMap[dominant] || dominant;
            cam.emotion = `${emoji} ${name}`;
            cam.emotionClass = dominant;
          }
        }
      } catch (err) {
        // ignore
      }
    };

    faceWs.onclose = () => {
      setTimeout(() => connectFaceWs(), 3000);
    };
  } catch (err) {
    console.error('人脸WebSocket连接失败:', err);
  }
};

const disconnectWs = () => {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (videoWs) {
    videoWs.onclose = null; // 防止触发重连
    videoWs.close();
    videoWs = null;
  }
  if (faceWs) {
    faceWs.onclose = null;
    faceWs.close();
    faceWs = null;
  }
};

const emotionNameMap = {
  happy: '快乐', sad: '悲伤', angry: '愤怒', neutral: '中性',
  fearful: '恐惧', surprised: '惊讶', disgusted: '厌恶', contempt: '蔑视'
};
const emotionEmojiMap = {
  happy: '😊', sad: '😢', angry: '😠', neutral: '😐',
  fearful: '😨', surprised: '😲', disgusted: '🤢', contempt: '😏'
};
const emotionColorMap = {
  happy: 'linear-gradient(90deg, #fdcb6e, #e17055)',
  neutral: 'linear-gradient(90deg, #74b9ff, #6c8ef0)',
  sad: 'linear-gradient(90deg, #a29bfe, #6c8ef0)',
  angry: 'linear-gradient(90deg, #fd79a8, #e84393)',
  surprised: 'linear-gradient(90deg, #00cec9, #00b894)',
  fearful: 'linear-gradient(90deg, #b2bec3, #636e72)',
  disgusted: 'linear-gradient(90deg, #a29bfe, #6c5ce7)',
  contempt: 'linear-gradient(90deg, #dfe6e9, #b2bec3)',
};

const emotions = ref([]);

const recentAlerts = ref([]);

const trendData = ref([]);

const levelMap = { danger: 'high', warning: 'mid', info: 'low' };
const statusTextMap = { pending: '未处理', handled: '已处理', ignored: '已忽略' };
const badgeClassMap = { pending: 'badge-danger', handled: 'badge-success', ignored: 'badge-warning' };

// 从数据库加载摄像头列表
const loadCameras = async () => {
  try {
    const res = await devicesApi.getCameraList();
    const list = res.data || [];
    cameras.value = list.map(cam => ({
      id: cam.id,
      name: cam.name,
      status: cam.status || 'offline',
      emotion: cam.status === 'online' ? '检测中' : '离线',
      emotionClass: '',
      frame: null,
    }));
  } catch (e) {
    console.error('加载摄像头列表失败:', e);
  }
};

// 点击摄像头跳转到实时检测页面
const goToRealtime = (cam) => {
  router.push({ path: '/realtime', query: { camera: cam.id } });
};

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await faceApi.getGlobalStats();
    const data = res.data;

    stats.value[0].value = `${data.online_devices} / ${data.online_devices + (3 - data.online_devices)}`;
    stats.value[0].trend = data.online_devices > 0 ? '设备运行正常' : '无在线设备';
    stats.value[0].trendType = data.online_devices > 0 ? 'up' : 'down';

    stats.value[1].value = data.today_recognition.toLocaleString();
    stats.value[1].trend = `今日已识别 ${data.today_recognition} 次`;
    stats.value[1].trendType = data.today_recognition > 0 ? 'up' : 'neutral';

    stats.value[2].value = String(data.today_alerts);
    stats.value[2].trend = data.today_alerts > 0 ? `${data.today_alerts} 条待处理` : '暂无告警';
    stats.value[2].trendType = data.today_alerts > 0 ? 'up' : 'down';

    // 处理情绪分布
    const dist = data.emotion_distribution || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    const emList = [];
    for (const [key, count] of Object.entries(dist)) {
      const pct = Math.round(count / total * 100);
      if (pct > 0 || ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful'].includes(key)) {
        emList.push({
          name: emotionNameMap[key] || key,
          emoji: emotionEmojiMap[key] || '😶',
          pct: pct,
          color: emotionColorMap[key] || 'linear-gradient(90deg, #b2bec3, #636e72)',
        });
      }
    }
    emList.sort((a, b) => b.pct - a.pct);
    emotions.value = emList.length > 0 ? emList : [
      { name: '中性', emoji: '😐', pct: 0, color: emotionColorMap.neutral },
    ];
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载准确率
const loadAccuracy = async () => {
  try {
    const res = await reportsApi.getSummary({ reportType: 'daily' });
    const data = res.data;
    const accuracy = data.accuracy ? (data.accuracy * 100).toFixed(1) : '0';
    stats.value[3].value = accuracy + '%';
    stats.value[3].trend = `主要情绪: ${emotionNameMap[data.dominantEmotion] || data.dominantEmotion}`;
    stats.value[3].trendType = 'up';
  } catch (error) {
    console.error('加载准确率失败:', error);
  }
};

// 加载最近告警
const loadAlerts = async () => {
  try {
    const res = await alertsApi.getAlerts({ page: 1, pageSize: 3 });
    const items = res.data.list || [];
    recentAlerts.value = items.map(a => ({
      id: a.id,
      title: a.title,
      device: a.device || '未知设备',
      time: new Date(a.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      level: levelMap[a.level] || 'low',
      status: statusTextMap[a.status] || a.status,
      badgeClass: badgeClassMap[a.status] || 'badge-warning',
    }));
  } catch (error) {
    console.error('加载告警失败:', error);
  }
};

// 加载趋势数据
const loadTrend = async () => {
  try {
    const res = await reportsApi.getHourlyStats();
    const items = res.data || [];
    const maxCount = Math.max(...items.map(i => i.count), 1);
    const colors = [
      'linear-gradient(to top, #6c8ef0, #a29bfe)',
      'linear-gradient(to top, #00cec9, #00b894)',
      'linear-gradient(to top, #fdcb6e, #e17055)',
    ];
    // 取 8-16 时间段
    trendData.value = items
      .filter(i => parseInt(i.hour) >= 8 && parseInt(i.hour) <= 16)
      .map((i, idx) => ({
        label: i.hour + '时',
        value: i.count,
        height: Math.max(5, Math.round(i.count / maxCount * 100)),
        color: colors[idx % colors.length],
      }));
  } catch (error) {
    console.error('加载趋势数据失败:', error);
  }
};

onMounted(async () => {
  // 先加载摄像头列表和连接 WebSocket（核心功能）
  await loadCameras();
  const hasOnline = cameras.value.some(c => c.status === 'online');
  if (hasOnline) {
    connectVideoWs();
    connectFaceWs();
  }
  // 再加载其他统计数据（非阻塞）
  loadStats();
  loadAccuracy();
  loadAlerts();
  loadTrend();
});

onUnmounted(() => {
  disconnectWs();
});
</script>

<style scoped>
.dashboard {
  animation: fade-up 0.4s ease;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #6c8ef0 0%, #a29bfe 50%, #fd79a8 100%);
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 8px 30px rgba(108, 142, 240, 0.3);
}

.welcome-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-icon {
  font-size: 36px;
  animation: wave 2s infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  75% { transform: rotate(-5deg); }
}

.welcome-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.welcome-sub {
  font-size: 13px;
  opacity: 0.85;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.quick-action:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.quick-action svg {
  width: 18px;
  height: 18px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 20px rgba(108, 142, 240, 0.07);
  border: 1px solid rgba(108, 142, 240, 0.06);
  animation: card-in 0.5s ease backwards;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(108, 142, 240, 0.15);
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.stat-info { flex: 1; }

.stat-label {
  font-size: 12px;
  color: #b2bec3;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.value-primary { color: var(--primary); }
.value-mint { color: var(--mint); }
.value-pink { color: var(--pink); }
.value-yellow { color: #e17055; }

.stat-trend {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-trend.up { color: var(--green); }
.stat-trend.down { color: var(--pink); }
.stat-trend.neutral { color: #b2bec3; }

.stat-trend svg {
  width: 12px;
  height: 12px;
}

/* 主内容网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
}

@media (max-width: 1100px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

/* 监控卡片 */
.monitor-card {
  grid-column: 1;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff0f6;
  color: var(--pink);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--pink);
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.camera-feed {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
  aspect-ratio: 16/10;
  border: 1.5px solid #eef1ff;
  transition: all 0.3s ease;
}

.camera-feed:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(108, 142, 240, 0.15);
}

.camera-feed.offline {
  background: linear-gradient(135deg, #f8f9fa, #f0f0f0);
  border-color: #e0e0e0;
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #b2bec3;
}

.camera-placeholder svg {
  width: 28px;
  height: 28px;
}

.camera-placeholder span {
  font-size: 11px;
}

.camera-live-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.camera-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(45, 52, 54, 0.7));
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.camera-name {
  font-size: 11px;
  color: white;
  font-weight: 600;
}

.camera-emotion {
  font-size: 11px;
  color: white;
  font-weight: 700;
}

.camera-status-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid white;
}

.camera-status-dot.online {
  background: var(--green);
}

.camera-status-dot.offline {
  background: #b2bec3;
}

/* 情绪分布 */
.emotion-card {
  grid-column: 2;
}

.card-date {
  font-size: 12px;
  color: #b2bec3;
  background: #f8f9fa;
  padding: 3px 10px;
  border-radius: 20px;
}

.emotion-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.emotion-bar-item {}

.emotion-bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.emotion-name {
  font-size: 13px;
  color: #636e72;
  font-weight: 600;
}

.emotion-pct {
  font-size: 13px;
  color: #2d3436;
  font-weight: 700;
}

.emotion-bar-track {
  height: 8px;
  background: #f0f4ff;
  border-radius: 10px;
  overflow: hidden;
}

.emotion-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  animation: bar-grow 1s ease backwards;
}

@keyframes bar-grow {
  from { width: 0 !important; }
}

.header-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 告警列表 */
.alerts-card {
  grid-column: 1;
}

.view-all {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}

.view-all:hover {
  text-decoration: underline;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1.5px solid;
  transition: all 0.2s ease;
}

.alert-item:hover {
  transform: translateX(2px);
}

.alert-item.high {
  border-color: #ffe0ec;
  background: #fff8fb;
}

.alert-item.mid {
  border-color: #fff3dd;
  background: #fffcf5;
}

.alert-item.low {
  border-color: #e0f5ee;
  background: #f5fffa;
}

.alert-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fff0f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon-wrap svg {
  width: 18px;
  height: 18px;
  stroke: var(--pink);
}

.alert-item.mid .alert-icon-wrap {
  background: #fff8ed;
}

.alert-item.mid .alert-icon-wrap svg {
  stroke: var(--yellow);
}

.alert-item.low .alert-icon-wrap {
  background: var(--green-light);
}

.alert-item.low .alert-icon-wrap svg {
  stroke: var(--green);
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 2px;
}

.alert-time {
  font-size: 11px;
  color: #b2bec3;
}

/* 趋势迷你图 */
.trend-card {
  grid-column: 2;
}

.mini-chart {
  height: 140px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.mini-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}

.mini-bar-fill {
  width: 100%;
  flex: 1;
  border-radius: 6px 6px 0 0;
  transition: height 0.5s ease;
  animation: bar-rise 0.8s ease backwards;
}

@keyframes bar-rise {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); }
}

.mini-bar-label {
  font-size: 10px;
  color: #b2bec3;
  white-space: nowrap;
}
</style>
