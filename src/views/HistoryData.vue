<template>
  <div class="history-data">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background: linear-gradient(135deg, #a29bfe, #6c5ce7)">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <h2>历史数据</h2>
        </div>
      </div>
      <div class="header-actions">
        <div class="history-tabs">
          <button class="hist-tab" :class="{ active: historyMode === 'data' }" @click="historyMode = 'data'">数据记录</button>
          <button class="hist-tab" :class="{ active: historyMode === 'video' }" @click="historyMode = 'video'; loadVideos()">视频回放</button>
        </div>
        <el-button v-if="historyMode === 'data'" type="primary" @click="exportData">
          <i class="el-icon-download"></i> 导出数据
        </el-button>
      </div>
    </div>

    <!-- 数据记录模式 -->
    <template v-if="historyMode === 'data'">

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="情绪类型">
          <el-select v-model="filterForm.emotion" placeholder="请选择情绪类型" style="width: 150px">
            <el-option label="全部" value=""></el-option>
            <el-option label="中性" value="neutral"></el-option>
            <el-option label="开心" value="happy"></el-option>
            <el-option label="悲伤" value="sad"></el-option>
            <el-option label="愤怒" value="angry"></el-option>
            <el-option label="恐惧" value="fearful"></el-option>
            <el-option label="厌恶" value="disgusted"></el-option>
            <el-option label="惊讶" value="surprised"></el-option>
            <el-option label="蔑视" value="contempt"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备">
          <el-select v-model="filterForm.device" placeholder="请选择设备" style="width: 160px">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="d in deviceOptions" :key="d.id" :label="d.name" :value="d.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData">
            <i class="el-icon-search"></i> 查询
          </el-button>
          <el-button @click="resetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="data-table">
      <el-table
        :data="historyData"
        style="width: 100%"
        border
        stripe
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="200"></el-table-column>
        <el-table-column prop="device" label="设备" width="200">
          <template #default="scope">
            {{ getDeviceName(scope.row.device) }}
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="200">
          <template #default="scope">
            {{ formatTime(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="emotion" label="情绪" width="140">
          <template #default="scope">
            <span class="emotion-tag" :class="scope.row.emotion">
              {{ getEmotionName(scope.row.emotion) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="140">
          <template #default="scope">
            {{ scope.row.confidence }}%
          </template>
        </el-table-column>
        <el-table-column prop="valence" label="效价" width="140">
          <template #default="scope">
            {{ scope.row.valence?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="arousal" label="唤醒度" width="140">
          <template #default="scope">
            {{ scope.row.arousal?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="pleasure" label="愉悦度" width="140">
          <template #default="scope">
            {{ scope.row.pleasure?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="dominance" label="支配度" width="140">
          <template #default="scope">
            {{ scope.row.dominance?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">
              查看
            </el-button>
            <el-button size="small" type="danger" @click="deleteRecord(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalRecords"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    </template>

    <!-- 视频回放模式 -->
    <template v-if="historyMode === 'video'">
      <div class="video-filter">
        <el-form :inline="true">
          <el-form-item label="摄像头">
            <el-select v-model="videoFilter.camera" placeholder="全部" style="width:160px" @change="loadVideos">
              <el-option label="全部" value=""></el-option>
              <el-option v-for="d in deviceOptions" :key="d.id" :label="d.name" :value="d.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker v-model="videoFilter.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="选择日期" @change="loadVideos"></el-date-picker>
          </el-form-item>
        </el-form>
      </div>

      <div class="video-main-grid">
        <!-- 左侧：视频 + 情绪指标 -->
        <div class="video-left">
          <div class="video-player-card" v-if="playingVideo">
            <div class="card-header">
              <h3>{{ playingVideo.camera_name || playingVideo.camera_id }}</h3>
              <span style="font-size:12px;color:#b2bec3">{{ formatTime(playingVideo.start_time) }} · {{ playingVideo.duration }}秒</span>
            </div>
            <div class="video-player-wrap">
              <video ref="videoPlayerRef" :src="playingVideo.url" controls autoplay
                @timeupdate="onVideoTimeUpdate"
                style="width:100%;height:600px;background:#000;border-radius:8px;object-fit:contain"></video>
            </div>
          </div>
          <div v-else class="video-player-card">
            <div style="padding:60px;text-align:center;color:#b2bec3">请从右侧选择一段视频</div>
          </div>

          <!-- 人脸切换 -->
          <div class="vp-face-switch" v-if="videoCurrentFaces.length > 0">
            <span style="font-size:12px;font-weight:700;color:#636e72;margin-right:8px">人脸:</span>
            <button v-for="(f, i) in videoCurrentFaces" :key="i"
              class="vf-btn" :class="{ active: videoFaceIdx === i }" @click="videoFaceIdx = i">
              人脸 {{ i + 1 }} · {{ emotionLabel(f.dominant_emotion) }}
            </button>
          </div>

          <!-- 情绪评价指标（跟实时检测一样的4个按钮） -->
          <div class="vp-indicator-card">
            <div class="card-header">
              <h3>情绪评价指标</h3>
            </div>
            <div class="vp-indicator-body">
              <div class="indicator-btns">
                <button class="ind-btn" :class="{ active: vpTab === 'overview' }" @click="vpTab = 'overview'">整体分布</button>
                <button class="ind-btn" :class="{ active: vpTab === 'discrete' }" @click="vpTab = 'discrete'">离散情绪 (1D)</button>
                <button class="ind-btn" :class="{ active: vpTab === 'va' }" @click="vpTab = 'va'">二维情感 (VA)</button>
                <button class="ind-btn" :class="{ active: vpTab === 'pad' }" @click="vpTab = 'pad'">三维情感 (PAD)</button>
              </div>
              <div v-show="vpTab === 'overview'" class="vp-chart" ref="vpOverviewRef"></div>
              <div v-show="vpTab === 'discrete'" class="vp-chart" ref="vpDiscreteRef"></div>
              <div v-show="vpTab === 'va'" class="vp-chart" ref="vpVaRef"></div>
              <div v-show="vpTab === 'pad'" class="vp-chart" ref="vpPadRef"></div>
            </div>
          </div>
        </div>

        <!-- 右侧：视频列表 -->
        <div class="video-right">
          <div class="video-list-card">
            <div class="card-header">
              <h3>视频列表</h3>
              <span class="face-count">{{ videoTotal }} 段</span>
            </div>
            <div class="video-list-scroll">
              <div v-for="v in videoList" :key="v.id" class="vl-item" :class="{ active: playingVideo?.id === v.id }" @click="selectVideo(v)">
                <div class="vl-icon">▶</div>
                <div class="vl-info">
                  <div class="vl-name">{{ v.camera_name || v.camera_id }}</div>
                  <div class="vl-time">{{ formatTime(v.start_time) }}</div>
                  <div class="vl-meta">{{ v.duration }}秒 · {{ v.resolution }}</div>
                </div>
              </div>
              <div v-if="videoList.length === 0" style="padding:30px;text-align:center;color:#b2bec3;font-size:13px">暂无录制视频</div>
            </div>
            <div class="vl-pagination" v-if="videoTotal > videoPageSize">
              <el-pagination small layout="prev, pager, next" v-model:current-page="videoPage" :page-size="videoPageSize" :total="videoTotal" @current-change="loadVideos"></el-pagination>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      title="识别详情"
      width="600px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <div class="detail-item">
          <span class="label">ID:</span>
          <span class="value">{{ selectedRecord.id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">设备:</span>
          <span class="value">{{ getDeviceName(selectedRecord.device) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">时间:</span>
          <span class="value">{{ formatTime(selectedRecord.timestamp) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">情绪:</span>
          <span class="value">
            <span class="emotion-tag" :class="selectedRecord.emotion">
              {{ getEmotionName(selectedRecord.emotion) }}
            </span>
          </span>
        </div>
        <div class="detail-item">
          <span class="label">置信度:</span>
          <span class="value">{{ selectedRecord.confidence }}%</span>
        </div>
        <div class="detail-item">
          <span class="label">效价:</span>
          <span class="value">{{ selectedRecord.valence?.toFixed(2) || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">唤醒度:</span>
          <span class="value">{{ selectedRecord.arousal?.toFixed(2) || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">愉悦度:</span>
          <span class="value">{{ selectedRecord.pleasure?.toFixed(2) || selectedRecord.valence || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">PAD唤醒度:</span>
          <span class="value">{{ selectedRecord.pad_arousal?.toFixed(2) || selectedRecord.arousal || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">支配度:</span>
          <span class="value">{{ selectedRecord.dominance?.toFixed(2) || '-' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import { faceApi } from '../api/face';
import { devicesApi } from '../api/devices';
import { videoApi } from '../api/video';
import { formatTime, formatEmotion } from '../utils/format';

const filterForm = reactive({
  dateRange: null,
  emotion: '',
  device: ''
});

const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);
const showDetailDialog = ref(false);
const selectedRecord = ref(null);
const loading = ref(false);

// 模式切换
const historyMode = ref('data');

// 视频回放
const videoList = ref([]);
const videoTotal = ref(0);
const videoPage = ref(1);
const videoPageSize = 14;
const videoFilter = reactive({ camera: '', date: '' });
const playingVideo = ref(null);

// 视频回放人脸数据同步
const videoPlayerRef = ref(null);
const videoTimeline = ref([]);  // 按时间排序的人脸数据帧
const videoCurrentFaces = ref([]);
const videoFaceIdx = ref(0);
const videoActiveFace = computed(() => videoCurrentFaces.value[videoFaceIdx.value] || null);

// 视频回放情绪指标图表
const vpTab = ref('overview');
const vpOverviewRef = ref(null);
const vpDiscreteRef = ref(null);
const vpVaRef = ref(null);
const vpPadRef = ref(null);
let vpOverviewChart = null;
let vpDiscreteChart = null;
let vpVaChart = null;
let vpPadChart = null;

const emotionLabel = (key) => {
  const map = { neutral:'中性', happy:'开心', sad:'悲伤', angry:'愤怒', fearful:'恐惧', disgusted:'厌恶', surprised:'惊讶', contempt:'蔑视' };
  return map[key] || key;
};
const emotionColor = (key) => {
  const map = { happy:'#67c23a', sad:'#409eff', angry:'#f56c6c', neutral:'#909399', fearful:'#e6a23c', surprised:'#17c6cf', disgusted:'#8e44ad', contempt:'#6c5ce7' };
  return map[key] || '#999';
};

const selectVideo = async (v) => {
  playingVideo.value = v;
  videoTimeline.value = [];
  videoCurrentFaces.value = [];
  videoFaceIdx.value = 0;

  // 加载该视频时间段的人脸数据
  if (v.start_ts && v.end_ts) {
    try {
      const res = await videoApi.getVideoFaces({
        camera_id: v.camera_id,
        start_ts: v.start_ts,
        end_ts: v.end_ts || v.start_ts + (v.duration || 60) * 1000,
      });
      videoTimeline.value = res.data.timeline || [];
    } catch (e) {
      console.error('加载人脸数据失败:', e);
    }
  }
};

const onVideoTimeUpdate = () => {
  if (!videoPlayerRef.value || videoTimeline.value.length === 0 || !playingVideo.value) return;

  const currentTime = videoPlayerRef.value.currentTime;
  const videoStartTs = playingVideo.value.start_ts;
  const currentTs = videoStartTs + currentTime * 1000;

  let closest = null;
  let minDiff = Infinity;
  for (const frame of videoTimeline.value) {
    const diff = Math.abs(frame.timestamp - currentTs);
    if (diff < minDiff) { minDiff = diff; closest = frame; }
  }

  if (closest && minDiff < 2000) {
    videoCurrentFaces.value = closest.faces;
    if (videoFaceIdx.value >= closest.faces.length) videoFaceIdx.value = 0;
    updateVpCharts();
  }
};

// ===== 视频回放图表 =====
const eColors = { happy:'#67c23a', sad:'#409eff', angry:'#f56c6c', neutral:'#909399', fearful:'#e6a23c', surprised:'#17c6cf', disgusted:'#8e44ad', contempt:'#6c5ce7' };
const eLabels = { happy:'开心', neutral:'中性', sad:'悲伤', angry:'愤怒', surprised:'惊讶', fearful:'恐惧', disgusted:'厌恶', contempt:'蔑视' };
const eOrder = ['happy','neutral','sad','angry','surprised','fearful','disgusted','contempt'];

const updateVpCharts = () => {
  if (vpTab.value === 'overview') updateVpOverview();
  else if (vpTab.value === 'discrete') updateVpDiscrete();
  else if (vpTab.value === 'va') updateVpVa();
  else if (vpTab.value === 'pad') updateVpPad();
};

const updateVpOverview = () => {
  if (!vpOverviewRef.value) return;
  if (!vpOverviewChart) vpOverviewChart = echarts.init(vpOverviewRef.value);
  const dist = {};
  eOrder.forEach(k => dist[k] = 0);
  videoCurrentFaces.value.forEach(f => { if (f.dominant_emotion && dist[f.dominant_emotion] !== undefined) dist[f.dominant_emotion]++; });
  const total = videoCurrentFaces.value.length || 1;
  vpOverviewChart.setOption({
    animation: false,
    grid: { left: 60, right: 50, top: 10, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 11 }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: eOrder.map(k => eLabels[k]), inverse: true, axisLabel: { fontSize: 12, fontWeight: 600 } },
    series: [{ type: 'bar', data: eOrder.map(k => ({ value: Math.round(dist[k]/total*100), itemStyle: { color: eColors[k] } })), barWidth: 16, label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, fontWeight: 'bold' } }]
  }, true);
};

const updateVpDiscrete = () => {
  if (!vpDiscreteRef.value) return;
  if (!vpDiscreteChart) vpDiscreteChart = echarts.init(vpDiscreteRef.value);
  const face = videoActiveFace.value;
  const expr = face?.expressions || {};
  vpDiscreteChart.setOption({
    animation: false,
    grid: { left: 60, right: 50, top: 10, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 11 }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: eOrder.map(k => eLabels[k]), inverse: true, axisLabel: { fontSize: 12, fontWeight: 600 } },
    series: [{ type: 'bar', data: eOrder.map(k => ({ value: Math.round((expr[k]||0)*100), itemStyle: { color: eColors[k] } })), barWidth: 16, label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, fontWeight: 'bold' } }]
  }, true);
};

const updateVpVa = () => {
  if (!vpVaRef.value) return;
  if (!vpVaChart) vpVaChart = echarts.init(vpVaRef.value);
  const face = videoActiveFace.value;
  const v = face?.valence ?? 0, a = face?.arousal ?? 0;
  vpVaChart.setOption({
    animation: false,
    grid: { left: 55, right: 30, top: 40, bottom: 50 },
    xAxis: { name: 'Valence', nameLocation: 'center', nameGap: 30, min: -1, max: 1, type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } } },
    yAxis: { name: 'Arousal', nameLocation: 'center', nameGap: 40, min: -1, max: 1, type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } } },
    graphic: [
      { type: 'text', left: '72%', top: '8%', style: { text: '兴奋/开心', fill: '#67c23a', fontSize: 11 } },
      { type: 'text', left: '8%', top: '8%', style: { text: '愤怒/恐惧', fill: '#f56c6c', fontSize: 11 } },
      { type: 'text', left: '8%', bottom: '15%', style: { text: '悲伤/厌恶', fill: '#409eff', fontSize: 11 } },
      { type: 'text', left: '72%', bottom: '15%', style: { text: '平静/满足', fill: '#909399', fontSize: 11 } },
    ],
    series: [{ type: 'scatter', symbolSize: 18, data: [[v, a]], itemStyle: { color: v >= 0 ? '#67c23a' : '#f56c6c', shadowBlur: 8 }, label: { show: true, formatter: `(${v.toFixed(2)}, ${a.toFixed(2)})`, position: 'top', fontSize: 11, fontWeight: 'bold' } }]
  }, true);
};

const updateVpPad = () => {
  if (!vpPadRef.value) return;
  if (!vpPadChart) vpPadChart = echarts.init(vpPadRef.value);
  const face = videoActiveFace.value;
  const p = face?.pleasure ?? 0, a = face?.pad_arousal ?? 0, d = face?.dominance ?? 0;
  vpPadChart.setOption({
    animation: false,
    radar: {
      indicator: [
        { name: `愉悦度\n${p.toFixed(2)}`, max: 1, min: -1 },
        { name: `唤醒度\n${a.toFixed(2)}`, max: 1, min: -1 },
        { name: `支配度\n${d.toFixed(2)}`, max: 1, min: -1 },
      ],
      radius: '60%', center: ['50%', '55%'],
      splitArea: { areaStyle: { color: ['rgba(108,142,240,0.05)', 'rgba(108,142,240,0.1)'] } }
    },
    series: [{ type: 'radar', data: [{ value: [p, a, d], areaStyle: { color: 'rgba(108,142,240,0.25)' }, lineStyle: { color: '#6c8ef0', width: 2 }, itemStyle: { color: '#6c8ef0' } }] }]
  }, true);
};

watch(vpTab, () => { nextTick(() => updateVpCharts()); });
watch(videoFaceIdx, () => updateVpCharts());

onUnmounted(() => {
  [vpOverviewChart, vpDiscreteChart, vpVaChart, vpPadChart].forEach(c => { if (c) c.dispose(); });
});

const loadVideos = async () => {
  try {
    const params = { page: videoPage.value, pageSize: videoPageSize };
    if (videoFilter.camera) params.camera_id = videoFilter.camera;
    if (videoFilter.date) params.date = videoFilter.date;
    const res = await videoApi.getVideoList(params);
    videoList.value = res.data.list || [];
    videoTotal.value = res.data.total || 0;
  } catch (e) {
    console.error('加载视频列表失败:', e);
  }
};

// 历史数据
const historyData = ref([]);

// 设备列表（从后端获取）
const deviceOptions = ref([]);

// 加载设备列表
const loadDevices = async () => {
  try {
    const res = await devicesApi.getCameraList();
    deviceOptions.value = res.data || [];
  } catch (error) {
    console.error('加载设备列表失败:', error);
  }
};

// 加载历史数据
const loadHistory = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = new Date(filterForm.dateRange[0]).toISOString();
      params.endDate = new Date(filterForm.dateRange[1] + ' 23:59:59').toISOString();
    }
    if (filterForm.emotion) {
      params.emotion = filterForm.emotion;
    }
    if (filterForm.device) {
      params.device = filterForm.device;
    }

    const res = await faceApi.getEmotionHistory(params);
    const items = res.data.list || [];
    totalRecords.value = res.data.total || 0;

    historyData.value = items.map(item => ({
      id: item.id,
      device: item.camera_id,
      timestamp: item.timestamp,
      emotion: item.dominant_emotion,
      confidence: item.confidence ? Math.round(item.confidence * 100) : 0,
      valence: item.valence,
      arousal: item.arousal,
      pleasure: item.pleasure,
      pad_arousal: item.pad_arousal,
      dominance: item.dominance,
    }));
  } catch (error) {
    console.error('加载历史数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索数据
const searchData = () => {
  currentPage.value = 1;
  loadHistory();
};

// 重置筛选
const resetFilter = () => {
  filterForm.dateRange = null;
  filterForm.emotion = '';
  filterForm.device = '';
  currentPage.value = 1;
  loadHistory();
};

// 导出数据
const exportData = async () => {
  // 用当前筛选条件，分页拉取所有数据
  const allItems = [];
  let page = 1;
  const size = 100;

  try {
    ElMessage.info('正在导出，请稍候...');

    while (true) {
      const params = { page, pageSize: size };
      if (filterForm.dateRange && filterForm.dateRange.length === 2) {
        params.startDate = new Date(filterForm.dateRange[0]).toISOString();
        params.endDate = new Date(filterForm.dateRange[1] + ' 23:59:59').toISOString();
      }
      if (filterForm.emotion) params.emotion = filterForm.emotion;
      if (filterForm.device) params.device = filterForm.device;

      const res = await faceApi.getEmotionHistory(params);
      const items = res.data.list || [];
      allItems.push(...items);

      if (items.length < size || allItems.length >= res.data.total) break;
      page++;
    }

    if (allItems.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    const headers = ['ID', '设备', '时间', '情绪', '置信度', '效价', '唤醒度', '愉悦度', '支配度'];
    const rows = allItems.map(item => [
      item.id || '',
      item.camera_id || '',
      item.timestamp || '',
      item.dominant_emotion || '',
      item.confidence ? (item.confidence * 100).toFixed(1) : '',
      item.valence != null ? item.valence.toFixed(4) : '',
      item.arousal != null ? item.arousal.toFixed(4) : '',
      item.pleasure != null ? item.pleasure.toFixed(4) : '',
      item.dominance != null ? item.dominance.toFixed(4) : '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success(`已导出 ${allItems.length} 条数据`);
  } catch (err) {
    console.error('导出失败:', err);
    ElMessage.error('导出失败，请检查控制台');
  }
};

// 查看详情
const viewDetail = (record) => {
  selectedRecord.value = record;
  showDetailDialog.value = true;
};

// 删除记录
const deleteRecord = (id) => {
  ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    historyData.value = historyData.value.filter(item => item.id !== id);
    ElMessage.success('删除成功');
  }).catch(() => {});
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadHistory();
};

// 处理分页页码变化
const handleCurrentChange = (current) => {
  currentPage.value = current;
  loadHistory();
};

// 获取设备名称
const getDeviceName = (deviceId) => {
  const device = deviceOptions.value.find(d => d.id === deviceId);
  return device ? device.name : deviceId;
};

// 获取情绪名称
const getEmotionName = (emotion) => {
  return formatEmotion(emotion);
};

onMounted(() => {
  loadDevices();
  loadHistory();
});
</script>

<style scoped>
.history-data {
  padding: 0;
  animation: fade-up 0.3s ease;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header-left { display: flex; align-items: center; gap: 14px; }

.page-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(108, 142, 240, 0.3);
}
.page-icon svg { width: 24px; height: 24px; }

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #2d3436;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108, 142, 240, 0.08);
  border: 1px solid rgba(108, 142, 240, 0.06);
  padding: 20px 22px;
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.data-table {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 20px rgba(108, 142, 240, 0.08);
  border: 1px solid rgba(108, 142, 240, 0.06);
  margin-bottom: 20px;
  overflow: hidden;
}

:deep(.el-table) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%) !important;
  color: #636e72;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-table tr:hover td) {
  background: #fafbff;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.record-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9ff;
}

.detail-item .label {
  width: 80px;
  font-size: 12px;
  font-weight: 700;
  color: #b2bec3;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
  color: #2d3436;
  font-size: 14px;
  font-weight: 600;
}

.emotion-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.emotion-tag.neutral { background: #f0f0f0; color: #636e72; }
.emotion-tag.happy { background: #fff9e6; color: #e17055; }
.emotion-tag.sad { background: #eef1ff; color: var(--primary); }
.emotion-tag.angry { background: #fff0f6; color: var(--pink); }
.emotion-tag.fearful { background: #fff8ed; color: var(--yellow); }
.emotion-tag.disgusted { background: var(--lavender-light); color: var(--lavender); }
.emotion-tag.surprised { background: var(--mint-light); color: var(--mint); }
.emotion-tag.contempt { background: #f0e6ff; color: #6c5ce7; }

@media (max-width: 768px) {
  .history-data { padding: 0; }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .filter-form {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-form .el-form-item {
    width: 100%;
  }

  .data-table {
    overflow-x: auto;
  }

  .pagination {
    justify-content: center;
  }
}

/* 历史模式切换 */
.history-tabs { display: flex; gap: 4px; margin-right: 12px; }
.hist-tab {
  padding: 6px 16px; border: 1.5px solid #eef1ff; border-radius: 20px;
  background: white; font-size: 13px; font-weight: 600; color: #b2bec3;
  cursor: pointer; transition: all 0.2s;
}
.hist-tab:hover { border-color: #6c8ef0; color: #6c8ef0; }
.hist-tab.active { background: #6c8ef0; border-color: #6c8ef0; color: white; }

/* 视频回放 */
.video-filter {
  background: white; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08); border: 1px solid rgba(108,142,240,0.06);
}
.video-playback-area { margin-bottom: 20px; }
.video-main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: stretch; }
.video-left { display: flex; flex-direction: column; gap: 16px; }
.video-right { position: relative; }
.video-player-card {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08); border: 1px solid rgba(108,142,240,0.06);
}
.video-player-wrap { padding: 12px; }

/* 人脸切换条 */
.vp-face-switch { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.vf-btn {
  padding: 4px 12px; border: 1.5px solid #eef1ff; border-radius: 16px;
  background: white; font-size: 12px; font-weight: 600; color: #b2bec3; cursor: pointer;
}
.vf-btn:hover { border-color: #6c8ef0; color: #6c8ef0; }
.vf-btn.active { background: #6c8ef0; border-color: #6c8ef0; color: white; }

/* 情绪指标卡片 */
.vp-indicator-card {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08); border: 1px solid rgba(108,142,240,0.06);
}
.vp-indicator-body { padding: 0 16px 16px; }
.vp-indicator-body .indicator-btns { display: flex; gap: 6px; margin-bottom: 12px; padding-top: 12px; flex-wrap: wrap; }
.vp-indicator-body .ind-btn {
  padding: 6px 14px; border: 1.5px solid #eef1ff; border-radius: 20px;
  background: white; font-size: 12px; font-weight: 600; color: #b2bec3;
  cursor: pointer; transition: all 0.2s;
}
.vp-indicator-body .ind-btn:hover { border-color: #6c8ef0; color: #6c8ef0; }
.vp-indicator-body .ind-btn.active { background: #6c8ef0; border-color: #6c8ef0; color: white; }
.vp-chart { height: 280px; width: 100%; }

/* 右侧视频列表 */
.video-list-card {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 20px rgba(108,142,240,0.08); border: 1px solid rgba(108,142,240,0.06);
  display: flex; flex-direction: column;
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
}
.video-list-scroll { flex: 1; overflow-y: auto; padding: 8px; }
.vl-pagination { padding: 8px 12px; border-top: 1px solid #eef1ff; text-align: center; flex-shrink: 0; }
.vl-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border: 1.5px solid #eef1ff; border-radius: 10px;
  margin-bottom: 6px; cursor: pointer; transition: all 0.2s; background: #fafbff;
}
.vl-item:hover { border-color: #6c8ef0; background: #eef1ff; }
.vl-item.active { border-color: #6c8ef0; background: #eef1ff; box-shadow: 0 2px 8px rgba(108,142,240,0.15); }
.vl-icon { font-size: 18px; color: #6c8ef0; flex-shrink: 0; }
.vl-info { flex: 1; min-width: 0; }
.vl-name { font-size: 12px; font-weight: 700; color: #2d3436; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vl-time { font-size: 11px; color: #636e72; }
.vl-meta { font-size: 10px; color: #b2bec3; }

@media (max-width: 900px) {
  .video-main-grid { grid-template-columns: 1fr; }
  .video-list-card { position: static; max-height: 400px; }
  .video-right { position: static; }
}

.video-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;
}
.video-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; background: white; border-radius: 12px;
  border: 1.5px solid #eef1ff; cursor: pointer; transition: all 0.2s;
}
.video-card:hover { border-color: #6c8ef0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(108,142,240,0.12); }
.video-card.active { border-color: #6c8ef0; background: #eef1ff; }
.vc-icon { font-size: 24px; color: #6c8ef0; flex-shrink: 0; }
.vc-info { flex: 1; min-width: 0; }
.vc-name { font-size: 13px; font-weight: 700; color: #2d3436; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vc-time { font-size: 11px; color: #636e72; margin-top: 2px; }
.vc-meta { font-size: 11px; color: #b2bec3; margin-top: 2px; }
</style>