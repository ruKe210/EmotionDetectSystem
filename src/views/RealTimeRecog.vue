<template>
  <div class="real-time-recog">
    <div class="page-header">
      <h2>实时情绪识别</h2>
      <div class="header-actions">
        <el-button type="primary" @click="startDetection" v-if="!isRunning">
          <i class="el-icon-video-play"></i> 开始检测
        </el-button>
        <el-button type="danger" @click="stopDetection" v-else>
          <i class="el-icon-video-pause"></i> 停止检测
        </el-button>
        <el-select v-model="cameraId" class="ml-2" @change="changeCamera">
          <el-option v-for="camera in cameras" :key="camera.id" :label="camera.name" :value="camera.id"></el-option>
        </el-select>
      </div>
    </div>

    <div class="content-grid">
      <div class="main-content">
        <div class="video-section">
          <div class="video-card">
            <div class="video-header">
              <h3>摄像头预览</h3>
              <span class="status-badge" :class="isRunning ? 'status-running' : 'status-stopped'">
                {{ isRunning ? '运行中' : '已停止' }}
              </span>
            </div>
            <div class="video-container">
              <FaceCanvas
                :camera-id="cameraId"
                :enable-detection="isRunning"
                @face-detected="handleFaceDetected"
                @detection-error="handleDetectionError"
              />
            </div>
          </div>

          <div class="emotion-trend">
            <div class="card-header">
              <h3>情绪评价指标</h3>
            </div>
            <div class="indicator-tabs">
              <el-tabs v-model="indicatorTab">
                <!-- 一维：离散情绪分布 -->
                <el-tab-pane label="离散情绪 (1D)" name="discrete">
                  <div class="indicator-chart" ref="discreteChartRef"></div>
                </el-tab-pane>
                <!-- 二维：Valence-Arousal 实时曲线 -->
                <el-tab-pane label="二维情感 (VA)" name="va">
                  <div class="indicator-chart" ref="vaChartRef"></div>
                </el-tab-pane>
                <!-- 三维：PAD 雷达图 -->
                <el-tab-pane label="三维情感 (PAD)" name="pad">
                  <div class="indicator-chart" ref="padChartRef"></div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <!-- 摄像头切换列表 -->
        <div class="camera-switch-list">
          <div class="card-header">
            <h3>摄像头列表</h3>
            <span class="face-count">{{ cameras.length }} 个</span>
          </div>
          <div class="camera-thumbs">
            <div
              v-for="cam in cameras" :key="cam.id"
              class="camera-thumb" :class="{ active: cameraId === cam.id }"
              @click="changeCamera(cam.id)"
            >
              <div class="thumb-indicator" :class="cameraId === cam.id ? 'current' : ''"></div>
              <div class="thumb-info">
                <div class="thumb-name">{{ cam.name }}</div>
                <div class="thumb-type">{{ cam.type === 'rtsp' ? 'RTSP' : 'USB' }}</div>
              </div>
              <span v-if="cameraId === cam.id" class="thumb-badge">当前</span>
            </div>
            <div v-if="cameras.length === 0" class="no-cameras">暂无摄像头</div>
          </div>
        </div>

        <GlobalStats :stats="globalStats" @refresh="refreshStats" />

        <div class="face-list">
          <div class="card-header">
            <h3>当前检测人脸</h3>
            <span class="face-count">{{ currentFaces.length }} 人</span>
          </div>
          <div class="face-items">
            <div v-for="(face, index) in currentFaces" :key="index" class="face-item" @click="selectFace(face, index)">
              <div class="face-info">
                <div class="face-id">人脸 {{ index + 1 }}</div>
                <div class="emotion-tag" :class="getEmotionClass(face)">{{ getMainEmotion(face) }}</div>
              </div>
              <div class="face-meta">
                <div class="confidence">{{ getConfidence(face) }}%</div>
                <div class="va-mini" v-if="face.valence !== undefined">
                  V:{{ face.valence?.toFixed(2) }} A:{{ face.arousal?.toFixed(2) }}
                </div>
              </div>
            </div>
            <div v-if="currentFaces.length === 0" class="no-faces">未检测到人脸</div>
          </div>
        </div>

        <FaceDetail v-if="selectedFace" v-model="showFaceDetail" :face-data="selectedFace" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { useFaceStore } from '../store/modules/faceStore';
import { useSystemStore } from '../store/modules/systemStore';
import FaceCanvas from '../components/FaceCanvas.vue';
import GlobalStats from '../components/GlobalStats.vue';
import FaceDetail from '../components/FaceDetail.vue';

const route = useRoute();
const faceStore = useFaceStore();
const systemStore = useSystemStore();

const isRunning = ref(false);
const cameraId = ref('');
const cameras = ref([]);
const currentFaces = ref([]);
const selectedFace = ref(null);
const showFaceDetail = ref(false);

const globalStats = computed(() => faceStore.globalStats);

const emotionData = reactive({
  happy: 0, sad: 0, angry: 0, neutral: 0,
  fearful: 0, surprised: 0, disgusted: 0, contempt: 0
});

const trendData = reactive({ times: [], values: [] });

// 情绪评价指标
const indicatorTab = ref('discrete');
const discreteChartRef = ref(null);
const vaChartRef = ref(null);
const padChartRef = ref(null);
let discreteChart = null;
let vaChart = null;
let padChart = null;

// VA 历史数据（最近 30 个点）
const vaHistory = reactive({ times: [], valence: [], arousal: [] });
// PAD 当前值
const padValues = reactive({ pleasure: 0, arousal: 0, dominance: 0 });

const startDetection = () => {
  isRunning.value = true;
  faceStore.startDetection();
};

const stopDetection = () => {
  isRunning.value = false;
  faceStore.stopDetection();
};

const changeCamera = (id) => {
  cameraId.value = id;
  faceStore.setCurrentCamera(id);
};

const handleFaceDetected = (faces) => {
  currentFaces.value = faces;
  faceStore.updateCurrentFaces(faces);
  updateEmotionData(faces);
  updateTrendData(faces);
  updateIndicatorCharts(faces);
};

const handleDetectionError = (error) => {
  console.error('检测错误:', error);
  faceStore.setDetectionError(error);
};

const updateEmotionData = (faces) => {
  const distribution = {
    happy: 0, sad: 0, angry: 0, neutral: 0,
    fearful: 0, surprised: 0, disgusted: 0, contempt: 0
  };
  faces.forEach(face => {
    const emotion = face.dominant_emotion;
    if (emotion && distribution[emotion] !== undefined) {
      distribution[emotion]++;
    } else if (face.expressions) {
      const max = Object.entries(face.expressions)
        .reduce((m, [k, v]) => v > m.value ? { key: k, value: v } : m, { key: 'neutral', value: 0 });
      if (distribution[max.key] !== undefined) distribution[max.key]++;
    }
  });
  Object.assign(emotionData, distribution);
};

const updateTrendData = (faces) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let avgValence = 0;
  if (faces.length > 0) {
    avgValence = faces.reduce((acc, f) => acc + (f.valence || 0), 0) / faces.length;
  }
  trendData.times.push(timeStr);
  trendData.values.push(Math.round((avgValence + 1) * 50));
  if (trendData.times.length > 30) {
    trendData.times.shift();
    trendData.values.shift();
  }
};

// ========== 情绪评价指标图表 ==========
const emotionColors = {
  happy: '#67c23a', sad: '#409eff', angry: '#f56c6c', neutral: '#909399',
  fearful: '#e6a23c', surprised: '#17c6cf', disgusted: '#8e44ad', contempt: '#6c5ce7'
};
const emotionLabels = {
  happy: '开心', sad: '悲伤', angry: '愤怒', neutral: '中性',
  fearful: '恐惧', surprised: '惊讶', disgusted: '厌恶', contempt: '蔑视'
};

const initDiscreteChart = () => {
  if (!discreteChartRef.value) return;
  if (discreteChart) discreteChart.dispose();
  discreteChart = echarts.init(discreteChartRef.value);
  updateDiscreteChart();
};

const updateDiscreteChart = () => {
  if (!discreteChart) return;
  const face = currentFaces.value.length > 0 ? currentFaces.value[0] : null;
  const expressions = face?.expressions || {};

  // 固定顺序，颜色不变
  const order = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'contempt'];
  const labels = order.map(k => emotionLabels[k]);
  const values = order.map(k => Math.round((expressions[k] || 0) * 100));
  const colors = order.map(k => emotionColors[k]);

  discreteChart.setOption({
    grid: { left: 60, right: 50, top: 10, bottom: 10 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 11 }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: labels, inverse: true, axisLabel: { fontSize: 12, fontWeight: 600 } },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
      barWidth: 16,
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, fontWeight: 'bold' }
    }]
  }, true);
};

const initVAChart = () => {
  if (!vaChartRef.value) return;
  if (vaChart) vaChart.dispose();
  vaChart = echarts.init(vaChartRef.value);
  updateVAChart();
};

const updateVAChart = () => {
  if (!vaChart) return;
  const v = vaHistory.valence.length > 0 ? vaHistory.valence[vaHistory.valence.length - 1] : 0;
  const a = vaHistory.arousal.length > 0 ? vaHistory.arousal[vaHistory.arousal.length - 1] : 0;

  vaChart.setOption({
    grid: { left: 55, right: 30, top: 40, bottom: 50 },
    xAxis: {
      name: 'Valence (效价)', nameLocation: 'center', nameGap: 30,
      min: -1, max: 1, type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      name: 'Arousal (唤醒度)', nameLocation: 'center', nameGap: 40,
      min: -1, max: 1, type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    graphic: [
      { type: 'text', left: '72%', top: '8%', style: { text: '兴奋/开心', fill: '#67c23a', fontSize: 11 } },
      { type: 'text', left: '8%', top: '8%', style: { text: '愤怒/恐惧', fill: '#f56c6c', fontSize: 11 } },
      { type: 'text', left: '8%', bottom: '15%', style: { text: '悲伤/厌恶', fill: '#409eff', fontSize: 11 } },
      { type: 'text', left: '72%', bottom: '15%', style: { text: '平静/满足', fill: '#909399', fontSize: 11 } },
    ],
    series: [{
      type: 'scatter', symbolSize: 18,
      data: [[v, a]],
      itemStyle: { color: v >= 0 ? '#67c23a' : '#f56c6c', shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' },
      label: { show: true, formatter: `(${v.toFixed(2)}, ${a.toFixed(2)})`, position: 'top', fontSize: 11, fontWeight: 'bold' }
    }]
  }, true);
};

const initPADChart = () => {
  if (!padChartRef.value) return;
  if (padChart) padChart.dispose();
  padChart = echarts.init(padChartRef.value);
  updatePADChart();
};

const updatePADChart = () => {
  if (!padChart) return;
  const p = padValues.pleasure, a = padValues.arousal, d = padValues.dominance;
  padChart.setOption({
    radar: {
      indicator: [
        { name: `愉悦度\n${p.toFixed(2)}`, max: 1, min: -1 },
        { name: `唤醒度\n${a.toFixed(2)}`, max: 1, min: -1 },
        { name: `支配度\n${d.toFixed(2)}`, max: 1, min: -1 },
      ],
      radius: '60%', center: ['50%', '55%'],
      splitArea: { areaStyle: { color: ['rgba(108,142,240,0.05)', 'rgba(108,142,240,0.1)'] } }
    },
    series: [{
      type: 'radar',
      data: [{ value: [p, a, d], name: '当前情感',
        areaStyle: { color: 'rgba(108,142,240,0.25)' },
        lineStyle: { color: '#6c8ef0', width: 2 },
        itemStyle: { color: '#6c8ef0' }
      }]
    }]
  }, true);
};

// 人脸数据更新时同步更新图表
const updateIndicatorCharts = (faces) => {
  if (faces.length === 0) return;
  const face = faces[0]; // 取第一个人脸

  // 更新 VA 历史
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  vaHistory.times.push(timeStr);
  vaHistory.valence.push(face.valence ?? 0);
  vaHistory.arousal.push(face.arousal ?? 0);
  if (vaHistory.times.length > 30) {
    vaHistory.times.shift(); vaHistory.valence.shift(); vaHistory.arousal.shift();
  }

  // 更新 PAD
  padValues.pleasure = face.pleasure ?? face.valence ?? 0;
  padValues.arousal = face.pad_arousal ?? face.arousal ?? 0;
  padValues.dominance = face.dominance ?? 0;

  // 刷新当前可见的图表
  if (indicatorTab.value === 'discrete') updateDiscreteChart();
  else if (indicatorTab.value === 'va') updateVAChart();
  else if (indicatorTab.value === 'pad') updatePADChart();
};

// 切换 tab 时初始化对应图表
watch(indicatorTab, () => {
  nextTick(() => {
    if (indicatorTab.value === 'discrete') initDiscreteChart();
    else if (indicatorTab.value === 'va') initVAChart();
    else if (indicatorTab.value === 'pad') initPADChart();
  });
});

const selectFace = (face, index) => {
  selectedFace.value = {
    id: face.face_id || `face-${index}-${Date.now()}`,
    timestamp: Date.now(),
    ...face,
    valence: face.valence ?? 0,
    arousal: face.arousal ?? 0,
    pleasure: face.pleasure ?? face.valence ?? 0,
    pad_arousal: face.pad_arousal ?? face.arousal ?? 0,
    dominance: face.dominance ?? 0,
  };
  showFaceDetail.value = true;
};

const getMainEmotion = (face) => {
  if (face.dominant_emotion) return emotionMap[face.dominant_emotion] || face.dominant_emotion;
  if (!face.expressions) return '未知';
  const max = Object.entries(face.expressions)
    .reduce((m, [k, v]) => v > m.value ? { key: k, value: v } : m, { key: 'neutral', value: 0 });
  return emotionMap[max.key] || max.key;
};

const emotionMap = {
  neutral: '中性', happy: '开心', sad: '悲伤', angry: '愤怒',
  fearful: '恐惧', disgusted: '厌恶', surprised: '惊讶', contempt: '蔑视'
};

const getConfidence = (face) => {
  if (face.emotion_confidence) return Math.round(face.emotion_confidence * 100);
  if (!face.expressions) return 0;
  const max = Object.entries(face.expressions)
    .reduce((m, [k, v]) => v > m.value ? { key: k, value: v } : m, { key: 'neutral', value: 0 });
  return Math.round(max.value * 100);
};

const getEmotionClass = (face) => {
  if (face.dominant_emotion) return face.dominant_emotion;
  if (!face.expressions) return 'neutral';
  const max = Object.entries(face.expressions)
    .reduce((m, [k, v]) => v > m.value ? { key: k, value: v } : m, { key: 'neutral', value: 0 });
  return max.key;
};

const refreshStats = async () => {
  try {
    const { faceApi } = await import('../api/face');
    const res = await faceApi.getGlobalStats();
    const data = res.data;
    faceStore.updateGlobalStats({
      onlineDevices: data.online_devices || 0,
      currentFaces: data.current_faces || 0,
      todayRecognition: data.today_recognition || 0,
      todayAlerts: data.today_alerts || 0,
      cpuUsage: data.cpu_usage || 0,
      memoryUsage: data.memory_usage || 0,
      uptime: data.uptime ? `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m` : '0h 0m',
      emotionDistribution: data.emotion_distribution || {},
    });
  } catch (e) {
    console.error('刷新统计失败:', e);
  }
};

const loadCameras = async () => {
  try {
    const { devicesApi } = await import('../api/devices');
    const res = await devicesApi.getCameraList();
    const list = res.data || [];
    if (list.length > 0) {
      cameras.value = list.map(cam => ({ id: cam.id, name: cam.name, type: cam.type }));
      const queryCam = route.query.camera;
      if (queryCam && cameras.value.find(c => c.id === queryCam)) {
        cameraId.value = queryCam;
      } else {
        cameraId.value = cameras.value[0].id;
      }
      faceStore.updateCameras(cameras.value);
      faceStore.setCurrentCamera(cameraId.value);
    } else {
      cameras.value = [{ id: '', name: '默认摄像头', type: 'usb' }];
      cameraId.value = '';
    }
  } catch (err) {
    console.error('获取摄像头列表失败:', err);
    cameras.value = [{ id: '', name: '默认摄像头', type: 'usb' }];
    cameraId.value = '';
  }
};

onMounted(async () => {
  await loadCameras();
  await refreshStats();
  faceStore.loadSystemConfig();
  systemStore.initSystem();
  startDetection();
  // 初始化默认图表
  nextTick(() => initDiscreteChart());
});

onUnmounted(() => {
  if (discreteChart) discreteChart.dispose();
  if (vaChart) vaChart.dispose();
  if (padChart) padChart.dispose();
});
</script>

<style scoped>
.real-time-recog { padding: 0; animation: fade-up 0.3s ease; }
@keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 {
  margin: 0; font-size: 22px; font-weight: 600; color: #3d4852;
  display: flex; align-items: center; gap: 12px; letter-spacing: -0.5px;
}
.page-header h2::before {
  content: ''; width: 4px; height: 28px;
  background: linear-gradient(135deg, var(--mint), var(--primary));
  border-radius: 4px; display: inline-block;
}
.header-actions { display: flex; align-items: center; gap: 10px; }

.content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
.main-content { display: flex; flex-direction: column; gap: 20px; }
.video-section { display: flex; flex-direction: column; gap: 20px; }

.video-card {
  background: white; border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08);
  border: 1px solid rgba(108,142,240,0.06);
  overflow: hidden; transition: box-shadow 0.3s ease;
}
.video-card:hover { box-shadow: 0 8px 30px rgba(108,142,240,0.15); }

.video-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-bottom: 1px solid #eef1ff;
  display: flex; justify-content: space-between; align-items: center;
}
.video-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #2d3436; }

.status-badge {
  padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; gap: 5px;
}
.status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
.status-running { background: var(--green-light); color: var(--green); }
.status-running::before { background: var(--green); animation: pulse-dot 1.5s infinite; }
@keyframes pulse-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
.status-stopped { background: var(--pink-light); color: var(--pink); }
.status-stopped::before { background: var(--pink); }

.video-container { padding: 12px; height: 600px; }

.emotion-trend {
  background: white; border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08);
  border: 1px solid rgba(108,142,240,0.06); overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-bottom: 1px solid #eef1ff;
  display: flex; justify-content: space-between; align-items: center;
}
.card-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #2d3436; }
.face-count {
  font-size: 12px; font-weight: 700; color: var(--primary);
  background: var(--primary-light); padding: 3px 10px; border-radius: 20px;
}
.chart-container { padding: 16px; height: 280px; }

/* 情绪评价指标 */
.indicator-tabs { padding: 0 16px 16px; }
.indicator-tabs :deep(.el-tabs__header) { margin-bottom: 12px; }
.indicator-tabs :deep(.el-tabs__item) { font-size: 13px; font-weight: 600; }
.indicator-chart { height: 260px; width: 100%; }

.side-panel { display: flex; flex-direction: column; gap: 16px; }

/* 摄像头切换列表 */
.camera-switch-list {
  background: white; border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08);
  border: 1px solid rgba(108,142,240,0.06); overflow: hidden;
}
.camera-thumbs { padding: 8px; max-height: 220px; overflow-y: auto; }
.camera-thumb {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border: 1.5px solid #eef1ff; border-radius: 10px;
  margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease; background: #fafbff;
}
.camera-thumb:hover { border-color: var(--primary); background: var(--primary-light); transform: translateX(2px); }
.camera-thumb.active { border-color: var(--primary); background: var(--primary-light); box-shadow: 0 2px 8px rgba(108,142,240,0.15); }
.thumb-indicator { width: 8px; height: 8px; border-radius: 50%; background: #b2bec3; flex-shrink: 0; }
.thumb-indicator.current { background: var(--green); animation: pulse-dot 1.5s infinite; }
.thumb-info { flex: 1; min-width: 0; }
.thumb-name { font-size: 13px; font-weight: 700; color: #2d3436; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.thumb-type { font-size: 11px; color: #b2bec3; }
.thumb-badge { font-size: 10px; font-weight: 700; color: var(--primary); background: white; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
.no-cameras { text-align: center; padding: 20px; color: #b2bec3; font-size: 13px; }

/* 人脸列表 */
.face-list {
  background: white; border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08);
  border: 1px solid rgba(108,142,240,0.06); overflow: hidden;
}
.face-items { padding: 12px; max-height: 380px; overflow-y: auto; }
.face-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px; border: 1.5px solid #eef1ff; border-radius: 10px;
  margin-bottom: 8px; cursor: pointer; transition: all 0.25s ease; background: #fafbff;
}
.face-item:hover { border-color: var(--primary); background: var(--primary-light); transform: translateX(2px); }
.face-info { display: flex; align-items: center; gap: 10px; }
.face-id { font-size: 13px; font-weight: 700; color: #2d3436; }
.face-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.confidence { font-size: 13px; font-weight: 800; color: var(--green); background: var(--green-light); padding: 2px 8px; border-radius: 10px; }
.va-mini { font-size: 10px; color: #909399; font-family: monospace; }
.no-faces { text-align: center; padding: 36px 20px; color: #b2bec3; font-size: 14px; }

.emotion-tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
.emotion-tag.neutral { background: #f0f0f0; color: #636e72; }
.emotion-tag.happy { background: #fff9e6; color: #e17055; }
.emotion-tag.sad { background: #eef1ff; color: var(--primary); }
.emotion-tag.angry { background: #fff0f6; color: var(--pink); }
.emotion-tag.fearful { background: #fff8ed; color: var(--yellow); }
.emotion-tag.disgusted { background: var(--lavender-light); color: var(--lavender); }
.emotion-tag.surprised { background: var(--mint-light); color: var(--mint); }
.emotion-tag.contempt { background: #f0e6ff; color: #6c5ce7; }

@media (max-width: 1200px) {
  .content-grid { grid-template-columns: 1fr; }
  .side-panel { order: -1; display: grid; grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .header-actions { width: 100%; justify-content: space-between; }
  .video-container { height: 300px; padding: 8px; }
  .chart-container { height: 220px; padding: 10px; }
  .side-panel { grid-template-columns: 1fr; }
}
</style>
