<template>
  <div class="reports-page" ref="reportExportRef">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background: linear-gradient(135deg, #fdcb6e, #e17055)">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <div>
          <div class="page-title">统计报表</div>
          <div class="page-sub">情绪识别数据分析与统计</div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" :disabled="exportingPdf" @click="exportPDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ exportingPdf ? '导出中...' : '导出报表PDF' }}
        </button>
      </div>
    </div>

    <!-- 报表配置 -->
    <div class="card config-card">
      <div class="card-header">
        <h4>
          <span class="header-dot" style="background: var(--yellow)"></span>
          报表配置
        </h4>
      </div>
      <div class="card-body">
        <div class="config-grid">
          <div class="config-item">
            <label>报表类型</label>
            <div class="type-selector">
              <button
                v-for="t in reportTypes"
                :key="t.value"
                class="type-btn"
                :class="{ active: reportType === t.value }"
                @click="reportType = t.value"
              >{{ t.label }}</button>
            </div>
          </div>
          <div class="config-item">
            <label>统计时段</label>
            <el-date-picker
              v-if="reportType === 'daily'"
              v-model="dayValue"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择某一天"
              class="w-full"
            />
            <el-date-picker
              v-else-if="reportType === 'weekly'"
              v-model="weekValue"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择该周任意一天"
              class="w-full"
            />
            <el-date-picker
              v-else-if="reportType === 'monthly'"
              v-model="monthValue"
              type="month"
              value-format="YYYY-MM"
              placeholder="选择某一月"
              class="w-full"
            />
            <el-date-picker
              v-else
              v-model="customRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="w-full"
            />
          </div>
          <div class="config-item">
            <label>设备选择</label>
            <select class="form-control" v-model="selectedDevice">
              <option value="">所有设备</option>
              <option v-for="d in deviceOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据摘要 -->
    <div class="summary-grid">
      <div class="summary-card" v-for="s in summaryData" :key="s.key" :class="s.cls">
        <div class="sc-icon-wrap">
          <div class="sc-icon" v-html="s.icon"></div>
        </div>
        <div class="sc-content">
          <div class="sc-value">{{ s.value }}</div>
          <div class="sc-label">{{ s.label }}</div>
          <div class="sc-change" :class="s.changeType">{{ s.change }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 情绪占比 -->
      <div class="card chart-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--primary)"></span>
            情绪占比分布
          </h4>
          <span class="period-tag">{{ periodLabel }}</span>
        </div>
        <div class="card-body">
          <div class="donut-chart-wrap">
            <div class="donut-chart">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f4ff" stroke-width="30"/>
                <circle
                  v-for="(seg, i) in donutSegments"
                  :key="i"
                  cx="100" cy="100" r="80"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="30"
                  :stroke-dasharray="seg.dash"
                  :stroke-dashoffset="seg.offset"
                  stroke-linecap="round"
                  style="transition: stroke-dasharray 1s ease;"
                />
              </svg>
              <div class="donut-center">
                <div class="donut-total">{{ totalRecognition.toLocaleString() }}</div>
                <div class="donut-sub">次识别</div>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item" v-for="em in emotionData" :key="em.name">
                <span class="legend-dot" :style="{ background: em.color }"></span>
                <span class="legend-name">{{ em.emoji }} {{ em.name }}</span>
                <span class="legend-pct">{{ em.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时段分布 -->
      <div class="card chart-card">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--mint)"></span>
            时段识别频次
          </h4>
        </div>
        <div class="card-body">
          <div class="bar-chart">
            <div class="bar-chart-inner">
              <div
                v-for="bar in hourlyData"
                :key="bar.hour"
                class="bar-col"
              >
                <div class="bar-value">{{ bar.value }}</div>
                <div class="bar-fill-wrap">
                  <div
                    class="bar-fill"
                    :style="{ height: (bar.value / maxHourly * 100) + '%', background: bar.color }"
                  ></div>
                </div>
                <div class="bar-label">{{ bar.hour }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势折线 -->
      <div class="card chart-card wide">
        <div class="card-header">
          <h4>
            <span class="header-dot" style="background: var(--lavender)"></span>
            {{ trendTitle }}
          </h4>
          <div class="legend-tabs">
            <span class="legend-chip" style="background: var(--primary-light); color: var(--primary)">
              <span class="legend-dot" style="background: var(--primary)"></span>总识别
            </span>
            <span class="legend-chip" style="background: var(--pink-light); color: var(--pink)">
              <span class="legend-dot" style="background: var(--pink)"></span>异常情绪
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="line-chart">
            <svg viewBox="0 0 600 200" preserveAspectRatio="none" class="line-svg">
              <!-- 网格线 -->
              <line v-for="y in [50, 100, 150]" :key="y" x1="0" :y1="y" x2="600" :y2="y" stroke="#f0f4ff" stroke-width="1"/>
              <!-- 面积 -->
              <path :d="areaPath" fill="url(#areaGrad)" opacity="0.3"/>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6c8ef0" stop-opacity="0.5"/>
                  <stop offset="100%" stop-color="#6c8ef0" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <!-- 折线 -->
              <polyline :points="linePoints" fill="none" stroke="#6c8ef0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- 告警线 -->
              <polyline :points="alertPoints" fill="none" stroke="#fd79a8" stroke-width="2" stroke-dasharray="5,3" stroke-linecap="round"/>
              <!-- 数据点 -->
              <circle v-for="(pt, i) in linePointsArr" :key="i" :cx="pt.x" :cy="pt.y" r="4" fill="white" stroke="#6c8ef0" stroke-width="2"/>
            </svg>
            <!-- X轴标签 -->
            <div class="x-axis" :style="{ gridTemplateColumns: `repeat(${Math.max(trendAxisLabels.length, 1)}, minmax(0, 1fr))` }">
              <span v-for="(d, i) in trendAxisLabels" :key="i">{{ d }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { reportsApi } from '../api/reports';
import { devicesApi } from '../api/devices';

const reportType = ref('daily');
const dayValue = ref('');
const weekValue = ref('');
const monthValue = ref('');
const customRange = ref([]);
const selectedDevice = ref('');
const deviceOptions = ref([]);
const reportExportRef = ref(null);
const exportingPdf = ref(false);

const emotionNameMap = {
  happy: '快乐', sad: '悲伤', angry: '愤怒', neutral: '中性',
  fearful: '恐惧', surprised: '惊讶', disgusted: '厌恶', contempt: '蔑视'
};
const emotionEmojiMap = {
  happy: '😊', sad: '😢', angry: '😠', neutral: '😐',
  fearful: '😨', surprised: '😲', disgusted: '🤢', contempt: '😏'
};
const emotionColorMap = {
  happy: '#fdcb6e', neutral: '#74b9ff', sad: '#a29bfe',
  angry: '#fd79a8', surprised: '#00cec9', fearful: '#b2bec3',
  disgusted: '#6c5ce7', contempt: '#dfe6e9',
};

const reportTypes = [
  { label: '日报表', value: 'daily' },
  { label: '周报表', value: 'weekly' },
  { label: '月报表', value: 'monthly' },
  { label: '自定义', value: 'custom' },
];

const summaryData = ref([
  { key: 'total', label: '总识别次数', value: '-', change: '加载中...', changeType: 'neutral', cls: 'primary', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>` },
  { key: 'accuracy', label: '平均准确率', value: '-', change: '加载中...', changeType: 'neutral', cls: 'mint', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { key: 'alerts', label: '告警次数', value: '-', change: '加载中...', changeType: 'neutral', cls: 'pink', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
  { key: 'dominant', label: '主导情绪', value: '-', change: '加载中...', changeType: 'neutral', cls: 'yellow', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>` },
]);

const emotionData = ref([]);
const totalRecognition = ref(0);

const hourlyData = ref([]);
const maxHourly = computed(() => Math.max(...hourlyData.value.map(d => d.value), 1));

const weekDays = ref([]);
const weekData = ref([]);
const alertDataWeek = ref([]);

const toYmd = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const setupDefaultPeriod = () => {
  const now = new Date();
  dayValue.value = toYmd(now);
  weekValue.value = toYmd(now);
  monthValue.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  customRange.value = [toYmd(new Date(now.getTime() - 6 * 24 * 3600 * 1000)), toYmd(now)];
};

const periodLabel = computed(() => {
  if (reportType.value === 'daily') return dayValue.value ? `${dayValue.value}（日报）` : '日报';
  if (reportType.value === 'weekly') return weekValue.value ? `${weekValue.value} 所在周` : '周报';
  if (reportType.value === 'monthly') return monthValue.value ? `${monthValue.value}（月报）` : '月报';
  if (customRange.value?.length === 2) return `${customRange.value[0]} ~ ${customRange.value[1]}`;
  return '自定义时段';
});

const trendTitle = computed(() => {
  if (reportType.value === 'daily') return '近7日识别趋势';
  if (reportType.value === 'weekly') return '本周逐日识别趋势';
  if (reportType.value === 'monthly') return '本月逐日识别趋势';
  return '时段内逐日识别趋势';
});

const trendAxisLabels = computed(() => {
  const labels = weekDays.value || [];
  const maxShown = 8;
  if (labels.length <= maxShown) return labels;
  const step = Math.ceil(labels.length / maxShown);
  return labels.map((label, idx) => (idx % step === 0 || idx === labels.length - 1 ? label : ''));
});

const buildReportParams = () => {
  const params = { reportType: reportType.value };
  if (selectedDevice.value) params.device = selectedDevice.value;

  if (reportType.value === 'daily' && dayValue.value) {
    params.startDate = dayValue.value;
  } else if (reportType.value === 'weekly' && weekValue.value) {
    params.startDate = weekValue.value;
  } else if (reportType.value === 'monthly' && monthValue.value) {
    params.startDate = monthValue.value;
  } else if (reportType.value === 'custom' && customRange.value?.length === 2) {
    params.startDate = customRange.value[0];
    params.endDate = customRange.value[1];
  }
  return params;
};

// 加载设备列表
const loadDevices = async () => {
  try {
    const res = await devicesApi.getCameraList();
    deviceOptions.value = res.data || [];
  } catch (error) {
    console.error('加载设备列表失败:', error);
  }
};

// 加载摘要数据
const loadSummary = async () => {
  try {
    const res = await reportsApi.getSummary(buildReportParams());
    const data = res.data;

    summaryData.value[0].value = data.total.toLocaleString();
    summaryData.value[0].change = `共 ${data.total} 次识别`;
    summaryData.value[0].changeType = 'up';
    totalRecognition.value = data.total;

    const accuracy = data.accuracy ? (data.accuracy * 100).toFixed(1) : '0';
    summaryData.value[1].value = accuracy + '%';
    summaryData.value[1].change = '平均置信度';
    summaryData.value[1].changeType = 'up';

    summaryData.value[2].value = String(data.alerts);
    summaryData.value[2].change = data.alerts > 0 ? `${data.alerts} 条告警` : '无告警';
    summaryData.value[2].changeType = data.alerts > 0 ? 'up' : 'down';

    const dominant = data.dominantEmotion || 'neutral';
    summaryData.value[3].value = `${emotionEmojiMap[dominant] || '😶'} ${emotionNameMap[dominant] || dominant}`;
    summaryData.value[3].change = '最常见情绪';
    summaryData.value[3].changeType = 'neutral';
  } catch (error) {
    console.error('加载摘要失败:', error);
  }
};

// 加载情绪分布
const loadEmotionDistribution = async () => {
  try {
    const res = await reportsApi.getEmotionDistribution(buildReportParams());
    const items = res.data || [];
    emotionData.value = items.map(item => ({
      name: emotionNameMap[item.emotion] || item.emotion,
      emoji: emotionEmojiMap[item.emotion] || '😶',
      pct: item.pct,
      color: emotionColorMap[item.emotion] || '#b2bec3',
    }));
  } catch (error) {
    console.error('加载情绪分布失败:', error);
  }
};

// 加载每小时统计
const loadHourly = async () => {
  try {
    const res = await reportsApi.getHourlyStats(buildReportParams());
    const items = res.data || [];
    const colors = [
      'linear-gradient(to top, #6c8ef0, #a29bfe)',
      'linear-gradient(to top, #00cec9, #6c8ef0)',
      'linear-gradient(to top, #fdcb6e, #e17055)',
    ];
    hourlyData.value = items
      .filter(i => parseInt(i.hour) >= 8 && parseInt(i.hour) <= 18)
      .map((i, idx) => ({
        hour: i.hour + '时',
        value: i.count,
        color: colors[idx % colors.length],
      }));
  } catch (error) {
    console.error('加载每小时统计失败:', error);
  }
};

// 加载趋势
const loadTrend = async () => {
  try {
    const params = buildReportParams();
    params.days = reportType.value === 'daily' ? 7 : 31;
    const res = await reportsApi.getTrend(params);
    const data = res.data;

    weekDays.value = (data.dates || []).map(d => {
      const date = new Date(d);
      if (reportType.value === 'daily') {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
      }
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    weekData.value = data.total || [];
    alertDataWeek.value = data.alerts || [];
  } catch (error) {
    console.error('加载趋势失败:', error);
  }
};

// 甜甜圈图
const circumference = 2 * Math.PI * 80;
const donutSegments = computed(() => {
  let offset = 0;
  return emotionData.value.map(em => {
    const dashLength = (em.pct / 100) * circumference;
    const seg = {
      color: em.color,
      dash: `${Math.max(dashLength - 4, 0)} ${circumference - Math.max(dashLength - 4, 0)}`,
      offset: -(offset - circumference / 4)
    };
    offset += dashLength;
    return seg;
  });
});

// 折线图
const maxWeekData = computed(() => Math.max(...weekData.value, 1));

const linePointsArr = computed(() => {
  if (weekData.value.length === 0) return [];
  const left = 30;
  const right = 570;
  const spacing = (right - left) / Math.max(weekData.value.length - 1, 1);
  return weekData.value.map((v, i) => ({
    x: left + i * spacing,
    y: 180 - (v / (maxWeekData.value * 1.2) * 160)
  }));
});

const linePoints = computed(() =>
  linePointsArr.value.map(p => `${p.x},${p.y}`).join(' ')
);

const areaPath = computed(() => {
  const pts = linePointsArr.value;
  if (pts.length === 0) return '';
  const start = `M${pts[0].x},180`;
  const line = pts.map(p => `L${p.x},${p.y}`).join(' ');
  const end = `L${pts[pts.length - 1].x},180 Z`;
  return `${start} ${line} ${end}`;
});

const alertPoints = computed(() => {
  if (alertDataWeek.value.length === 0) return '';
  const maxAlert = Math.max(...alertDataWeek.value, 1);
  const left = 30;
  const right = 570;
  const spacing = (right - left) / Math.max(alertDataWeek.value.length - 1, 1);
  return alertDataWeek.value.map((v, i) => {
    const x = left + i * spacing;
    const y = 180 - (v / (maxAlert * 1.5) * 80);
    return `${x},${y}`;
  }).join(' ');
});

const loadAll = () => {
  loadSummary();
  loadEmotionDistribution();
  loadHourly();
  loadTrend();
};

const exportPDF = async () => {
  if (!reportExportRef.value || exportingPdf.value) return;
  try {
    exportingPdf.value = true;
    await nextTick();
    const canvas = await html2canvas(reportExportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: reportExportRef.value.scrollWidth,
      windowHeight: reportExportRef.value.scrollHeight,
      onclone: (clonedDoc) => {
        // html2canvas 在部分 linear-gradient 上会触发 addColorStop 非有限值错误，导出时降级为纯色
        const root = clonedDoc.querySelector('.reports-page');
        if (!root) return;

        root.querySelectorAll('.bar-fill').forEach((el) => {
          el.style.background = '#6c8ef0';
        });
        root.querySelectorAll('.type-btn.active').forEach((el) => {
          el.style.background = '#e17055';
          el.style.borderColor = '#e17055';
        });
        root.querySelectorAll('.page-icon').forEach((el) => {
          el.style.background = '#e17055';
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let remaining = imgHeight;
    let yPos = margin;
    pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
    remaining -= (pageHeight - margin * 2);

    while (remaining > 0) {
      pdf.addPage();
      yPos = margin - (imgHeight - remaining);
      pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
      remaining -= (pageHeight - margin * 2);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`情绪统计报表_${ts}.pdf`);
    ElMessage.success('PDF 导出成功');
  } catch (error) {
    console.error('导出 PDF 失败:', error);
    ElMessage.error('PDF 导出失败');
  } finally {
    exportingPdf.value = false;
  }
};

watch([reportType, selectedDevice, dayValue, weekValue, monthValue, customRange], () => {
  loadAll();
});

onMounted(() => {
  setupDefaultPeriod();
  loadDevices();
  loadAll();
});
</script>

<style scoped>
.reports-page { animation: fade-up 0.3s ease; }

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
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(253, 203, 110, 0.4);
}

.page-icon svg { width: 24px; height: 24px; }
.page-title { font-size: 20px; font-weight: 800; color: #2d3436; }
.page-sub { font-size: 13px; color: #b2bec3; margin-top: 2px; }
.page-actions { display: flex; gap: 10px; }

/* 配置卡片 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: end;
}

@media (max-width: 1100px) {
  .config-grid { grid-template-columns: repeat(2, 1fr); }
}

.config-item { display: flex; flex-direction: column; gap: 8px; }
.w-full { width: 100%; }

.config-item label {
  font-size: 12px;
  font-weight: 700;
  color: #b2bec3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-selector { display: flex; gap: 4px; }

.type-btn {
  padding: 7px 14px;
  border: 1.5px solid #eef1ff;
  border-radius: 8px;
  background: white;
  font-size: 12px;
  font-weight: 600;
  color: #b2bec3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn.active {
  background: linear-gradient(135deg, #fdcb6e, #e17055);
  border-color: transparent;
  color: white;
}

.type-btn:hover:not(.active) { border-color: var(--primary); color: var(--primary); }

/* 数据摘要 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}

.summary-card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1.5px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(108, 142, 240, 0.06);
}

.summary-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(108, 142, 240, 0.12); }

.sc-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-icon :deep(svg) { width: 22px; height: 22px; }

.summary-card.primary .sc-icon-wrap { background: var(--primary-light); }
.summary-card.primary .sc-icon :deep(svg) { stroke: var(--primary); }
.summary-card.mint .sc-icon-wrap { background: var(--mint-light); }
.summary-card.mint .sc-icon :deep(svg) { stroke: var(--mint); }
.summary-card.pink .sc-icon-wrap { background: var(--pink-light); }
.summary-card.pink .sc-icon :deep(svg) { stroke: var(--pink); }
.summary-card.yellow .sc-icon-wrap { background: var(--yellow-light); }
.summary-card.yellow .sc-icon :deep(svg) { stroke: #e17055; }

.sc-value { font-size: 22px; font-weight: 800; color: #2d3436; }
.sc-label { font-size: 12px; color: #b2bec3; font-weight: 600; margin-top: 2px; }
.sc-change { font-size: 11px; font-weight: 700; margin-top: 3px; }
.sc-change.up { color: var(--green); }
.sc-change.down { color: var(--pink); }
.sc-change.neutral { color: #b2bec3; }

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card.wide { grid-column: 1 / -1; }

@media (max-width: 1100px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.wide { grid-column: 1; }
}

.header-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.period-tag {
  background: #f8f9fa;
  color: #b2bec3;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
}

/* 甜甜圈图 */
.donut-chart-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
}

.donut-chart {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.donut-chart svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total { font-size: 22px; font-weight: 800; color: #2d3436; }
.donut-sub { font-size: 11px; color: #b2bec3; }

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name { flex: 1; color: #636e72; }
.legend-pct { font-weight: 700; color: #2d3436; }

/* 柱状图 */
.bar-chart {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.bar-chart-inner {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.bar-value { font-size: 10px; font-weight: 700; color: #636e72; flex-shrink: 0; }

.bar-fill-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  border-radius: 6px 6px 0 0;
  animation: bar-rise 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes bar-rise {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); }
}

.bar-label { font-size: 10px; color: #b2bec3; white-space: nowrap; flex-shrink: 0; }

/* 折线图 */
.line-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.line-svg {
  width: 100%;
  height: 200px;
}

.x-axis {
  display: grid;
  gap: 0;
  padding: 0 30px;
}

.x-axis span {
  font-size: 12px;
  color: #b2bec3;
  text-align: center;
}

.legend-tabs { display: flex; gap: 8px; }

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}
</style>
