<template>
  <el-dialog
    v-model="visible"
    title="人脸详情"
    width="650px"
    @close="handleClose"
  >
    <div v-if="faceData" class="face-detail">
      <div class="face-info">
        <div class="face-basic">
          <div class="face-id">
            <span class="label">人脸ID:</span>
            <span class="value">{{ faceData.id || faceData.face_id }}</span>
          </div>
          <div class="face-time">
            <span class="label">检测时间:</span>
            <span class="value">{{ formatTime(faceData.timestamp) }}</span>
          </div>
        </div>

        <!-- 离散情绪分析 -->
        <div class="emotion-info">
          <h5>离散情绪分析 (8类)</h5>
          <div class="emotion-tags">
            <span
              v-for="(value, key) in faceData.expressions"
              :key="key"
              class="emotion-tag"
              :class="[key, { dominant: key === faceData.dominant_emotion }]"
            >
              {{ getEmotionName(key) }}: {{ (value * 100).toFixed(1) }}%
            </span>
          </div>
        </div>

        <!-- 二维情感: Valence-Arousal -->
        <div class="emotion-model">
          <h5>二维情感模型 (Valence-Arousal)</h5>
          <div class="model-chart model-chart-large">
            <canvas ref="vaChart"></canvas>
          </div>
          <div class="model-values">
            <div class="value-item">
              <span class="label">效价 (Valence):</span>
              <span class="value" :class="getValenceClass(faceData.valence)">
                {{ formatDimValue(faceData.valence) }}
              </span>
              <span class="desc">{{ getValenceDesc(faceData.valence) }}</span>
            </div>
            <div class="value-item">
              <span class="label">唤醒度 (Arousal):</span>
              <span class="value" :class="getArousalClass(faceData.arousal)">
                {{ formatDimValue(faceData.arousal) }}
              </span>
              <span class="desc">{{ getArousalDesc(faceData.arousal) }}</span>
            </div>
          </div>
        </div>

        <!-- 三维情感: PAD -->
        <div class="emotion-model">
          <h5>三维情感模型 (PAD)</h5>
          <div class="model-chart model-chart-large">
            <canvas ref="padChart"></canvas>
          </div>
          <div class="model-values">
            <div class="value-item">
              <span class="label">愉悦度 (Pleasure):</span>
              <span class="value" :class="getValenceClass(faceData.pleasure)">
                {{ formatDimValue(faceData.pleasure) }}
              </span>
            </div>
            <div class="value-item">
              <span class="label">唤醒度 (Arousal):</span>
              <span class="value" :class="getArousalClass(faceData.pad_arousal)">
                {{ formatDimValue(faceData.pad_arousal) }}
              </span>
            </div>
            <div class="value-item">
              <span class="label">支配度 (Dominance):</span>
              <span class="value" :class="getDominanceClass(faceData.dominance)">
                {{ formatDimValue(faceData.dominance) }}
              </span>
              <span class="desc">{{ getDominanceDesc(faceData.dominance) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">
      加载中...
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  faceData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const activeTab = ref('va');
const vaChart = ref(null);
const padChart = ref(null);
const trendChart = ref(null);
let vaChartInstance = null;
let padChartInstance = null;
let trendChartInstance = null;

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const formatDimValue = (val) => {
  if (val === undefined || val === null) return 'N/A';
  return (val >= 0 ? '+' : '') + val.toFixed(3);
};

const getEmotionName = (emotion) => {
  const map = {
    neutral: '中性', happy: '开心', sad: '悲伤', angry: '愤怒',
    fearful: '恐惧', disgusted: '厌恶', surprised: '惊讶', contempt: '蔑视'
  };
  return map[emotion] || emotion;
};

// VA 描述
const getValenceClass = (v) => {
  if (v === undefined || v === null) return '';
  return v >= 0.2 ? 'positive' : v <= -0.2 ? 'negative' : 'neutral-val';
};
const getArousalClass = (a) => {
  if (a === undefined || a === null) return '';
  return a >= 0.2 ? 'high' : a <= -0.2 ? 'low' : 'medium';
};
const getDominanceClass = (d) => {
  if (d === undefined || d === null) return '';
  return d >= 0.2 ? 'dominant' : d <= -0.2 ? 'submissive' : 'balanced';
};

const getValenceDesc = (v) => {
  if (v === undefined || v === null) return '';
  if (v >= 0.5) return '积极';
  if (v >= 0.2) return '偏积极';
  if (v <= -0.5) return '消极';
  if (v <= -0.2) return '偏消极';
  return '中性';
};
const getArousalDesc = (a) => {
  if (a === undefined || a === null) return '';
  if (a >= 0.5) return '高唤醒';
  if (a >= 0.2) return '偏活跃';
  if (a <= -0.5) return '低唤醒';
  if (a <= -0.2) return '偏平静';
  return '中等';
};
const getDominanceDesc = (d) => {
  if (d === undefined || d === null) return '';
  if (d >= 0.3) return '主导';
  if (d <= -0.3) return '顺从';
  return '中等';
};

// ---- 二维 VA 散点图 (Valence-Arousal 坐标系) ----
const initVAChart = () => {
  if (!vaChart.value || !props.faceData) return;
  vaChartInstance = echarts.init(vaChart.value);
  updateVAChart();
};

const updateVAChart = () => {
  if (!vaChartInstance || !props.faceData) return;

  const v = props.faceData.valence ?? 0;
  const a = props.faceData.arousal ?? 0;

  const option = {
    title: {
      text: 'Valence-Arousal 二维情感空间',
      textStyle: { fontSize: 13, fontWeight: 600, color: '#303133' },
      left: 'center', top: 5
    },
    grid: { left: 60, right: 30, top: 45, bottom: 50 },
    xAxis: {
      name: 'Valence (效价)',
      nameLocation: 'center',
      nameGap: 30,
      min: -1, max: 1,
      splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      name: 'Arousal (唤醒度)',
      nameLocation: 'center',
      nameGap: 40,
      min: -1, max: 1,
      splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    // 情绪象限标注
    graphic: [
      { type: 'text', left: '72%', top: '12%', style: { text: '兴奋/开心', fill: '#67c23a', fontSize: 11 } },
      { type: 'text', left: '10%', top: '12%', style: { text: '愤怒/恐惧', fill: '#f56c6c', fontSize: 11 } },
      { type: 'text', left: '10%', bottom: '15%', style: { text: '悲伤/厌恶', fill: '#409eff', fontSize: 11 } },
      { type: 'text', left: '72%', bottom: '15%', style: { text: '平静/满足', fill: '#909399', fontSize: 11 } },
    ],
    series: [{
      type: 'scatter',
      symbolSize: 18,
      data: [[v, a]],
      itemStyle: {
        color: v >= 0 ? '#67c23a' : '#f56c6c',
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.2)'
      },
      label: {
        show: true,
        formatter: `(${v.toFixed(2)}, ${a.toFixed(2)})`,
        position: 'top',
        fontSize: 11,
        fontWeight: 'bold'
      }
    }]
  };

  vaChartInstance.setOption(option);
};

// ---- 三维 PAD 雷达图 ----
const initPADChart = () => {
  if (!padChart.value || !props.faceData) return;
  padChartInstance = echarts.init(padChart.value);
  updatePADChart();
};

const updatePADChart = () => {
  if (!padChartInstance || !props.faceData) return;

  const p = props.faceData.pleasure ?? 0;
  const a = props.faceData.pad_arousal ?? 0;
  const d = props.faceData.dominance ?? 0;

  const option = {
    title: {
      text: 'PAD 三维情感模型',
      textStyle: { fontSize: 13, fontWeight: 600, color: '#303133' },
      left: 'center', top: 5
    },
    radar: {
      indicator: [
        { name: `愉悦度\n${p.toFixed(2)}`, max: 1, min: -1 },
        { name: `唤醒度\n${a.toFixed(2)}`, max: 1, min: -1 },
        { name: `支配度\n${d.toFixed(2)}`, max: 1, min: -1 },
      ],
      radius: '60%',
      center: ['50%', '55%'],
      axisLine: { lineStyle: { color: '#ddd' } },
      splitLine: { lineStyle: { color: '#eee' } },
      splitArea: { areaStyle: { color: ['rgba(108,142,240,0.05)', 'rgba(108,142,240,0.1)'] } }
    },
    series: [{
      name: 'PAD',
      type: 'radar',
      data: [{
        value: [p, a, d],
        name: '当前情感状态',
        areaStyle: {
          color: 'rgba(108, 142, 240, 0.25)'
        },
        lineStyle: { color: '#6c8ef0', width: 2 },
        itemStyle: { color: '#6c8ef0' }
      }]
    }]
  };

  padChartInstance.setOption(option);
};

// ---- 情绪趋势图 ----
const initTrendChart = () => {
  if (!trendChart.value || !props.faceData) return;
  trendChartInstance = echarts.init(trendChart.value);
  updateTrendChart();
};

const updateTrendChart = () => {
  if (!trendChartInstance || !props.faceData) return;

  const times = [];
  const valenceData = [];
  const arousalData = [];

  // 模拟趋势数据 (实际应用中从历史记录获取)
  const baseV = props.faceData.valence ?? 0;
  const baseA = props.faceData.arousal ?? 0;

  for (let i = 9; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60000);
    times.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    valenceData.push(Math.max(-1, Math.min(1, baseV + (Math.random() - 0.5) * 0.3)));
    arousalData.push(Math.max(-1, Math.min(1, baseA + (Math.random() - 0.5) * 0.3)));
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['效价', '唤醒度'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 15, bottom: 35 },
    xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: '', min: -1, max: 1, axisLabel: { fontSize: 10 } },
    series: [
      {
        name: '效价',
        type: 'line',
        data: valenceData,
        smooth: true,
        lineStyle: { color: '#67c23a' },
        itemStyle: { color: '#67c23a' },
        areaStyle: { color: 'rgba(103,194,58,0.15)' }
      },
      {
        name: '唤醒度',
        type: 'line',
        data: arousalData,
        smooth: true,
        lineStyle: { color: '#e6a23c' },
        itemStyle: { color: '#e6a23c' },
        areaStyle: { color: 'rgba(230,162,60,0.15)' }
      }
    ]
  };

  trendChartInstance.setOption(option);
};

// 初始化/更新所有图表
const initCharts = () => {
  initVAChart();
  initPADChart();
  initTrendChart();
};

const updateCharts = () => {
  updateVAChart();
  updatePADChart();
  updateTrendChart();
};

const handleResize = () => {
  if (vaChartInstance) vaChartInstance.resize();
  if (padChartInstance) padChartInstance.resize();
  if (trendChartInstance) trendChartInstance.resize();
};

watch(() => props.faceData, () => {
  updateCharts();
}, { deep: true });

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      initCharts();
    }, 100);
  }
});

watch(activeTab, () => {
  setTimeout(() => {
    if (activeTab.value === 'va') {
      initVAChart();
    } else if (activeTab.value === 'pad') {
      initPADChart();
    }
  }, 50);
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (vaChartInstance) vaChartInstance.dispose();
  if (padChartInstance) padChartInstance.dispose();
  if (trendChartInstance) trendChartInstance.dispose();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.face-detail {
  padding: 10px 0;
}

.face-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.face-basic {
  display: flex;
  gap: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.face-id,
.face-time {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.value.positive { color: #67c23a; }
.value.negative { color: #f56c6c; }
.value.neutral-val { color: #909399; }
.value.high { color: #e6a23c; }
.value.low { color: #409eff; }
.value.medium { color: #909399; }
.value.dominant { color: #6c5ce7; }
.value.submissive { color: #00b894; }
.value.balanced { color: #909399; }

.desc {
  font-size: 12px;
  color: #b2bec3;
  margin-left: 4px;
}

.emotion-info h5,
.emotion-model h5,
.emotion-trend h5 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.emotion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emotion-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.emotion-tag.dominant {
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transform: scale(1.05);
}

.emotion-tag.neutral { background: #909399; color: white; }
.emotion-tag.happy { background: #67c23a; color: white; }
.emotion-tag.sad { background: #409eff; color: white; }
.emotion-tag.angry { background: #f56c6c; color: white; }
.emotion-tag.fearful { background: #e6a23c; color: white; }
.emotion-tag.disgusted { background: #8e44ad; color: white; }
.emotion-tag.surprised { background: #17c6cf; color: white; }
.emotion-tag.contempt { background: #6c5ce7; color: white; }

.model-chart {
  height: 220px;
  margin-bottom: 15px;
}

.model-values {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8f9ff;
  border-radius: 8px;
  border: 1px solid #eef1ff;
}

.trend-chart {
  height: 200px;
}

.loading {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

@media (max-width: 768px) {
  .face-basic {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .model-values {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .model-chart,
  .trend-chart {
    height: 250px;
  }
}
</style>
