<template>
  <div class="reports-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon">
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
        <button class="btn btn-primary btn-sm" :disabled="exportingPdf || analysisLoading" @click="exportPDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ analysisLoading ? 'AI分析中...' : (exportingPdf ? '导出中...' : '导出正式PDF报告') }}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h4>报表配置</h4></div>
      <div class="card-body config-grid">
        <div class="config-item">
          <label>报表类型</label>
          <div class="type-selector">
            <button v-for="t in reportTypes" :key="t.value" class="type-btn" :class="{ active: reportType === t.value }" @click="reportType = t.value">{{ t.label }}</button>
          </div>
        </div>
        <div class="config-item">
          <label>统计时段</label>
          <el-date-picker v-if="reportType === 'daily'" v-model="dayValue" type="date" value-format="YYYY-MM-DD" placeholder="选择某一天" class="w-full"/>
          <el-date-picker v-else-if="reportType === 'weekly'" v-model="weekValue" type="date" value-format="YYYY-MM-DD" placeholder="选择该周任意一天" class="w-full"/>
          <el-date-picker v-else-if="reportType === 'monthly'" v-model="monthValue" type="month" value-format="YYYY-MM" placeholder="选择某一月" class="w-full"/>
          <el-date-picker v-else v-model="customRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="w-full"/>
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

    <div class="summary-grid" ref="summaryRef">
      <div class="summary-card" v-for="s in summaryData" :key="s.key">
        <div class="sc-value">{{ s.value }}</div>
        <div class="sc-label">{{ s.label }}</div>
        <div class="sc-change">{{ s.change }}</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card" ref="donutRef">
        <div class="card-header"><h4>情绪占比分布</h4><span class="period-tag">{{ periodLabel }}</span></div>
        <div class="card-body">
          <div class="donut-chart-wrap">
            <div class="donut-chart">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f4ff" stroke-width="30"/>
                <circle v-for="(seg, i) in donutSegments" :key="i" cx="100" cy="100" r="80" fill="none" :stroke="seg.color" stroke-width="30" :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset" stroke-linecap="round"/>
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

      <div class="card chart-card" ref="hourlyRef">
        <div class="card-header"><h4>时段识别频次</h4></div>
        <div class="card-body">
          <div class="bar-chart">
            <div class="bar-chart-inner">
              <div v-for="bar in hourlyData" :key="bar.hour" class="bar-col">
                <div class="bar-value">{{ bar.value }}</div>
                <div class="bar-fill-wrap"><div class="bar-fill" :style="{ height: (bar.value / maxHourly * 100) + '%', background: '#6c8ef0' }"></div></div>
                <div class="bar-label">{{ bar.hour }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card analysis-card" ref="analysisRef">
      <div class="card-header"><h4>智能分析</h4></div>
      <div class="card-body">
        <div v-if="analysisLoading" class="analysis-text">正在生成分析...</div>
        <pre v-else class="analysis-text">{{ analysisText }}</pre>
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

const exportingPdf = ref(false);
const analysisLoading = ref(false);
const analysisText = ref('点击“导出正式PDF报告”时将自动生成智能分析。');

const summaryRef = ref(null);
const donutRef = ref(null);
const hourlyRef = ref(null);
const analysisRef = ref(null);

const emotionNameMap = { happy: '快乐', sad: '悲伤', angry: '愤怒', neutral: '中性', fearful: '恐惧', surprised: '惊讶', disgusted: '厌恶', contempt: '蔑视' };
const emotionEmojiMap = { happy: '😊', sad: '😢', angry: '😠', neutral: '😐', fearful: '😨', surprised: '😲', disgusted: '🤢', contempt: '😏' };
const emotionColorMap = { happy: '#fdcb6e', neutral: '#74b9ff', sad: '#a29bfe', angry: '#fd79a8', surprised: '#00cec9', fearful: '#b2bec3', disgusted: '#6c5ce7', contempt: '#dfe6e9' };
const reportTypes = [{ label: '日报表', value: 'daily' }, { label: '周报表', value: 'weekly' }, { label: '月报表', value: 'monthly' }, { label: '自定义', value: 'custom' }];

const summaryData = ref([
  { key: 'total', label: '总识别次数', value: '-', change: '加载中...' },
  { key: 'accuracy', label: '平均准确率', value: '-', change: '加载中...' },
  { key: 'alerts', label: '告警次数', value: '-', change: '加载中...' },
  { key: 'dominant', label: '主导情绪', value: '-', change: '加载中...' },
]);
const emotionData = ref([]);
const totalRecognition = ref(0);
const hourlyData = ref([]);
const maxHourly = computed(() => Math.max(...hourlyData.value.map((d) => d.value), 1));
const circumference = 2 * Math.PI * 80;
const donutSegments = computed(() => {
  let offset = 0;
  return emotionData.value.map((em) => {
    const dashLength = (em.pct / 100) * circumference;
    const seg = { color: em.color, dash: `${Math.max(dashLength - 4, 0)} ${circumference - Math.max(dashLength - 4, 0)}`, offset: -(offset - circumference / 4) };
    offset += dashLength;
    return seg;
  });
});

const toYmd = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const setupDefaultPeriod = () => {
  const now = new Date();
  dayValue.value = toYmd(now);
  weekValue.value = toYmd(now);
  monthValue.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  customRange.value = [toYmd(new Date(now.getTime() - 6 * 86400000)), toYmd(now)];
};

const periodLabel = computed(() => {
  if (reportType.value === 'daily') return dayValue.value;
  if (reportType.value === 'weekly') return `${weekValue.value} 所在周`;
  if (reportType.value === 'monthly') return `${monthValue.value} 月`;
  return customRange.value?.length === 2 ? `${customRange.value[0]} ~ ${customRange.value[1]}` : '自定义时段';
});

const buildReportParams = () => {
  const params = { reportType: reportType.value };
  if (selectedDevice.value) params.device = selectedDevice.value;
  if (reportType.value === 'daily' && dayValue.value) params.startDate = dayValue.value;
  if (reportType.value === 'weekly' && weekValue.value) params.startDate = weekValue.value;
  if (reportType.value === 'monthly' && monthValue.value) params.startDate = monthValue.value;
  if (reportType.value === 'custom' && customRange.value?.length === 2) {
    params.startDate = customRange.value[0];
    params.endDate = customRange.value[1];
  }
  return params;
};

const loadDevices = async () => {
  try { const res = await devicesApi.getCameraList(); deviceOptions.value = res.data || []; } catch {}
};

const loadSummary = async () => {
  const res = await reportsApi.getSummary(buildReportParams());
  const data = res.data;
  summaryData.value[0].value = data.total.toLocaleString();
  summaryData.value[0].change = `共 ${data.total} 次识别`;
  totalRecognition.value = data.total;
  summaryData.value[1].value = `${((data.accuracy || 0) * 100).toFixed(1)}%`;
  summaryData.value[1].change = '平均置信度';
  summaryData.value[2].value = String(data.alerts);
  summaryData.value[2].change = data.alerts > 0 ? `${data.alerts} 条告警` : '无告警';
  const dominant = data.dominantEmotion || 'neutral';
  summaryData.value[3].value = `${emotionEmojiMap[dominant] || '😶'} ${emotionNameMap[dominant] || dominant}`;
  summaryData.value[3].change = '最常见情绪';
};

const loadEmotionDistribution = async () => {
  const res = await reportsApi.getEmotionDistribution(buildReportParams());
  const items = res.data || [];
  emotionData.value = items.map((item) => ({ name: emotionNameMap[item.emotion] || item.emotion, emoji: emotionEmojiMap[item.emotion] || '😶', pct: item.pct, color: emotionColorMap[item.emotion] || '#b2bec3' }));
};

const loadHourly = async () => {
  const res = await reportsApi.getHourlyStats(buildReportParams());
  const items = res.data || [];
  hourlyData.value = items.filter((i) => parseInt(i.hour, 10) >= 8 && parseInt(i.hour, 10) <= 18).map((i) => ({ hour: `${i.hour}时`, value: i.count }));
};

const loadIntelligentAnalysis = async () => {
  analysisLoading.value = true;
  try {
    const res = await reportsApi.getIntelligentAnalysis(buildReportParams());
    analysisText.value = res.data.analysis || '暂无分析结果';
  } catch {
    analysisText.value = '智能分析生成失败，请检查后端 ARK 配置后重试。';
  } finally {
    analysisLoading.value = false;
  }
};

const loadAll = async () => {
  try {
    await Promise.all([loadSummary(), loadEmotionDistribution(), loadHourly()]);
  } catch {
    ElMessage.error('报表数据加载失败');
  }
};

const snapshotElement = async (el) =>
  html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

const renderVirtualPage = async (html) => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.background = '#fff';
  host.innerHTML = html;
  document.body.appendChild(host);
  const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#ffffff' });
  document.body.removeChild(host);
  return canvas;
};

const exportPDF = async () => {
  if (exportingPdf.value || analysisLoading.value) return;
  exportingPdf.value = true;
  try {
    await loadIntelligentAnalysis();
    await nextTick();

    const summaryCanvas = await snapshotElement(summaryRef.value);
    const donutCanvas = await snapshotElement(donutRef.value);
    const hourlyCanvas = await snapshotElement(hourlyRef.value);
    const summaryImg = summaryCanvas.toDataURL('image/jpeg', 0.95);
    const donutImg = donutCanvas.toDataURL('image/jpeg', 0.95);
    const hourlyImg = hourlyCanvas.toDataURL('image/jpeg', 0.95);
    const safeAnalysis = (analysisText.value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .slice(0, 1600);

    const onePageCanvas = await renderVirtualPage(`
      <div style="width:794px;height:1123px;padding:28px 34px;box-sizing:border-box;font-family:Arial,sans-serif;background:#fff;color:#2d3436;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eef1ff;padding-bottom:10px;">
          <div>
            <div style="font-size:30px;font-weight:800;">情绪识别统计报告</div>
            <div style="margin-top:6px;font-size:14px;color:#636e72;">时间范围：${periodLabel.value}</div>
            <div style="margin-top:4px;font-size:14px;color:#636e72;">设备：${selectedDevice.value || '所有设备'}</div>
          </div>
          <div style="font-size:12px;color:#9aa3b2;">${new Date().toLocaleString()}</div>
        </div>
        <div style="margin-top:14px;">
          <img src="${summaryImg}" style="width:100%;height:auto;max-height:190px;object-fit:contain;background:#fff;border:1px solid #eef1ff;border-radius:8px;" />
        </div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <img src="${donutImg}" style="width:100%;height:260px;object-fit:cover;border:1px solid #eef1ff;border-radius:8px;" />
          <img src="${hourlyImg}" style="width:100%;height:260px;object-fit:cover;border:1px solid #eef1ff;border-radius:8px;" />
        </div>
        <div style="margin-top:14px;border:1px solid #eef1ff;border-radius:8px;padding:12px;">
          <div style="font-size:18px;font-weight:700;">智能分析</div>
          <div style="margin-top:8px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#3d4852;">${safeAnalysis}</div>
        </div>
        <div style="position:absolute;left:34px;right:34px;bottom:20px;font-size:11px;color:#9aa3b2;text-align:right;">
          报告生成时间：${new Date().toLocaleString()}
        </div>
      </div>
    `);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const drawW = pageWidth - margin * 2;
    const drawH = pageHeight - margin * 2;
    const onePageImg = onePageCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(onePageImg, 'JPEG', margin, margin, drawW, drawH);
    pdf.save(`情绪统计正式报告_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`);
    ElMessage.success('PDF 导出成功');
  } catch (e) {
    console.error('导出 PDF 失败:', e);
    ElMessage.error('PDF 导出失败');
  } finally {
    exportingPdf.value = false;
  }
};

watch([reportType, selectedDevice, dayValue, weekValue, monthValue, customRange], () => { loadAll(); });
onMounted(async () => { setupDefaultPeriod(); await loadDevices(); await loadAll(); });
</script>

<style scoped>
.reports-page { animation: fade-up 0.3s ease; }
@keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header-left { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fdcb6e, #e17055); }
.page-title { font-size: 20px; font-weight: 800; color: #2d3436; }
.page-sub { font-size: 13px; color: #b2bec3; margin-top: 2px; }
.config-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: end; }
.config-item { display: flex; flex-direction: column; gap: 8px; }
.w-full { width: 100%; }
.type-selector { display: flex; gap: 4px; }
.type-btn { padding: 7px 14px; border: 1.5px solid #eef1ff; border-radius: 8px; background: white; font-size: 12px; font-weight: 600; color: #b2bec3; cursor: pointer; }
.type-btn.active { background: #e17055; border-color: #e17055; color: white; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 20px 0; }
.summary-card { background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 2px 12px rgba(108, 142, 240, 0.06); }
.sc-value { font-size: 22px; font-weight: 800; color: #2d3436; }
.sc-label { font-size: 12px; color: #b2bec3; margin-top: 2px; }
.sc-change { font-size: 11px; color: #636e72; margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.period-tag { font-size: 12px; color: #636e72; }
.donut-chart-wrap { display: flex; align-items: center; gap: 24px; }
.donut-chart { position: relative; width: 180px; height: 180px; }
.donut-chart svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-name { flex: 1; color: #636e72; }
.legend-pct { font-weight: 700; color: #2d3436; }
.bar-chart { height: 200px; display: flex; flex-direction: column; }
.bar-chart-inner { flex: 1; display: flex; align-items: flex-end; gap: 8px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.bar-fill-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.bar-fill { width: 100%; border-radius: 6px 6px 0 0; }
.bar-label, .bar-value { font-size: 10px; color: #636e72; }
.analysis-card { margin-top: 20px; }
.analysis-text { margin: 0; white-space: pre-wrap; line-height: 1.7; color: #2d3436; font-size: 14px; }
@media (max-width: 1100px) { .config-grid, .summary-grid, .charts-grid { grid-template-columns: 1fr; } }
</style>
