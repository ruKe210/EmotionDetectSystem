<template>
  <div class="global-stats">
    <div class="stats-header">
      <h4>全局统计</h4>
      <el-button type="primary" size="small" @click="refreshStats">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </div>
    <div class="stats-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-video-camera"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">在线设备</div>
            <div class="stat-value">{{ stats.onlineDevices }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">当前检测人数</div>
            <div class="stat-value">{{ stats.currentFaces }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-sunny"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日识别次数</div>
            <div class="stat-value">{{ stats.todayRecognition }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-bell"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日告警数</div>
            <div class="stat-value">{{ stats.todayAlerts }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      onlineDevices: 0,
      currentFaces: 0,
      todayRecognition: 0,
      todayAlerts: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: '0h 0m',
      emotionDistribution: {
        happy: 0,
        sad: 0,
        angry: 0,
        neutral: 0,
        fearful: 0,
        surprised: 0,
        disgusted: 0
      }
    })
  }
});

const emit = defineEmits(['refresh']);

const emotionChart = ref(null);
let chartInstance = null;

// 刷新统计数据
const refreshStats = () => {
  emit('refresh');
};

// 初始化情绪分布图表
const initEmotionChart = () => {
  if (emotionChart.value) {
    chartInstance = echarts.init(emotionChart.value);
    updateEmotionChart();
  }
};

// 更新情绪分布图表
const updateEmotionChart = () => {
  if (!chartInstance) return;
  
  const emotionData = Object.entries(props.stats.emotionDistribution).map(([key, value]) => ({
    name: getEmotionName(key),
    value: value
  }));
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: emotionData.map(item => item.name)
    },
    series: [
      {
        name: '情绪分布',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: emotionData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
};

// 获取情绪名称
const getEmotionName = (emotion) => {
  const emotionMap = {
    neutral: '中性',
    happy: '开心',
    sad: '悲伤',
    angry: '愤怒',
    fearful: '恐惧',
    disgusted: '厌恶',
    surprised: '惊讶'
  };
  return emotionMap[emotion] || emotion;
};

// 监听stats变化
watch(() => props.stats, () => {
  updateEmotionChart();
}, { deep: true });

// 响应式调整
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

onMounted(() => {
  initEmotionChart();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时销毁图表
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.global-stats {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #69c0ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.emotion-distribution,
.system-status {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.emotion-distribution h5,
.system-status h5 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.emotion-chart {
  height: 200px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.status-label {
  font-size: 13px;
  color: #606266;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .emotion-chart {
    height: 250px;
  }
}
</style>