<template>
  <div class="alerts-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background: linear-gradient(135deg, #fd79a8, #e84393)">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div>
          <div class="page-title">告警管理</div>
          <div class="page-sub">共 <strong>{{ filteredAlerts.length }}</strong> 条告警记录</div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="markAllRead">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          全部处理
        </button>
        <button class="btn btn-primary btn-sm" @click="exportData">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
      </div>
    </div>

    <!-- 统计条 -->
    <div class="alert-summary">
      <div class="summary-item" v-for="s in summary" :key="s.label" :class="s.cls">
        <div class="summary-count">{{ s.count }}</div>
        <div class="summary-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="card">
      <div class="card-body filter-bar">
        <div class="filter-group">
          <label>状态筛选</label>
          <div class="filter-tabs">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              class="filter-tab"
              :class="{ active: activeFilter === tab.value }"
              @click="activeFilter = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <label>告警类型</label>
          <select class="form-control form-control-sm" v-model="filterType">
            <option value="">全部类型</option>
            <option value="emotion">异常情绪</option>
            <option value="device">设备异常</option>
            <option value="system">系统告警</option>
          </select>
        </div>
        <div class="filter-group">
          <label>搜索</label>
          <div class="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索告警..." v-model="searchText" class="form-control form-control-sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- 告警列表 -->
    <div class="card">
      <div class="card-body p0">
        <table class="fresh-table">
          <thead>
            <tr>
              <th>告警信息</th>
              <th>设备</th>
              <th>时间</th>
              <th>严重程度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(alert, i) in filteredAlerts" :key="alert.id" :style="{ animationDelay: i * 0.05 + 's' }" class="table-row-anim">
              <td>
                <div class="alert-cell">
                  <div class="alert-cell-icon" :class="alert.level">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <div>
                    <div class="alert-cell-title">{{ alert.title }}</div>
                    <div class="alert-cell-sub">ID: #{{ alert.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="device-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  {{ alert.device }}
                </div>
              </td>
              <td class="time-cell">{{ alert.time }}</td>
              <td>
                <div class="level-badge" :class="alert.level">
                  <span class="level-dot"></span>
                  {{ alert.levelText }}
                </div>
              </td>
              <td>
                <span class="badge" :class="alert.badgeClass">{{ alert.status }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-info btn-sm" @click="viewAlert(alert)">查看</button>
                  <button v-if="alert.rawStatus !== 'handled'" class="btn btn-success btn-sm" @click="handleAlert(alert)">处理</button>
                  <button v-if="alert.rawStatus === 'pending'" class="btn btn-warning btn-sm" @click="ignoreAlert(alert)">忽略</button>
                  <button v-if="alert.rawStatus === 'handled'" class="btn btn-secondary btn-sm">详情</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAlerts.length === 0">
              <td colspan="6" class="empty-state">
                <div class="empty-icon">🎉</div>
                <div>暂无告警记录</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { alertsApi } from '../api/alerts';

const activeFilter = ref('all');
const filterType = ref('');
const searchText = ref('');
const loading = ref(false);

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '未处理', value: 'pending' },
  { label: '已处理', value: 'handled' },
  { label: '已忽略', value: 'ignored' },
];

const alerts = ref([]);

const levelMap = { danger: 'high', warning: 'mid', info: 'low' };
const levelTextMap = { danger: '高危', warning: '中危', info: '低危' };
const statusTextMap = { pending: '未处理', handled: '已处理', ignored: '已忽略' };
const badgeClassMap = { pending: 'badge-danger', handled: 'badge-success', ignored: 'badge-warning' };

const loadAlerts = async () => {
  loading.value = true;
  try {
    const params = { page: 1, pageSize: 100 };
    if (activeFilter.value !== 'all') {
      params.status = activeFilter.value;
    }
    if (filterType.value) {
      params.type = filterType.value;
    }
    const res = await alertsApi.getAlerts(params);
    const items = res.data.list || [];
    alerts.value = items.map(a => ({
      id: a.id,
      title: a.title,
      device: a.device || '未知设备',
      time: formatDateTime(a.time),
      level: levelMap[a.level] || 'low',
      levelText: levelTextMap[a.level] || a.level,
      status: statusTextMap[a.status] || a.status,
      rawStatus: a.status,
      badgeClass: badgeClassMap[a.status] || 'badge-warning',
      type: a.type,
    }));
  } catch (error) {
    console.error('加载告警失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const summary = computed(() => [
  { label: '全部告警', count: alerts.value.length, cls: 'all' },
  { label: '未处理', count: alerts.value.filter(a => a.rawStatus === 'pending').length, cls: 'danger' },
  { label: '已处理', count: alerts.value.filter(a => a.rawStatus === 'handled').length, cls: 'success' },
  { label: '已忽略', count: alerts.value.filter(a => a.rawStatus === 'ignored').length, cls: 'warning' },
]);

const filteredAlerts = computed(() => {
  return alerts.value.filter(a => {
    if (searchText.value && !a.title.includes(searchText.value) && !a.device.includes(searchText.value)) return false;
    return true;
  });
});

const handleAlert = async (alert) => {
  try {
    await alertsApi.handleAlert(alert.id);
    alert.rawStatus = 'handled';
    alert.status = '已处理';
    alert.badgeClass = 'badge-success';
    ElMessage.success('处理成功');
  } catch (error) {
    console.error('处理告警失败:', error);
    ElMessage.error('操作失败');
  }
};

const ignoreAlert = async (alert) => {
  try {
    await alertsApi.ignoreAlert(alert.id);
    alert.rawStatus = 'ignored';
    alert.status = '已忽略';
    alert.badgeClass = 'badge-warning';
    ElMessage.success('已忽略');
  } catch (error) {
    console.error('忽略告警失败:', error);
    ElMessage.error('操作失败');
  }
};

const viewAlert = (alert) => console.log('view', alert);

const markAllRead = async () => {
  try {
    const pendingIds = alerts.value.filter(a => a.rawStatus === 'pending').map(a => a.id);
    if (pendingIds.length === 0) return;
    await alertsApi.batchHandle(pendingIds);
    alerts.value.forEach(a => {
      if (a.rawStatus === 'pending') {
        a.rawStatus = 'handled';
        a.status = '已处理';
        a.badgeClass = 'badge-success';
      }
    });
    ElMessage.success('批量处理成功');
  } catch (error) {
    console.error('批量处理失败:', error);
    ElMessage.error('操作失败');
  }
};

const exportData = () => console.log('export');

// 监听筛选变化
import { watch } from 'vue';
watch([activeFilter, filterType], () => {
  loadAlerts();
});

onMounted(() => {
  loadAlerts();
});
</script>

<style scoped>
.alerts-page { animation: fade-up 0.3s ease; }

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

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(253, 121, 168, 0.35);
}

.page-icon svg { width: 24px; height: 24px; }

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: #2d3436;
}

.page-sub {
  font-size: 13px;
  color: #b2bec3;
  margin-top: 2px;
}

.page-sub strong { color: var(--pink); }

.page-actions { display: flex; gap: 10px; }

/* 告警概览 */
.alert-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-item {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.summary-item:hover { transform: translateY(-2px); }
.summary-item.danger { border-color: #ffe0ec; background: #fff8fb; }
.summary-item.warning { border-color: #fff3dd; background: #fffcf5; }
.summary-item.success { border-color: #e0f5ee; background: #f5fffa; }
.summary-item.all { border-color: #eef1ff; background: #fafbff; }

.summary-count {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
}

.summary-item.danger .summary-count { color: var(--pink); }
.summary-item.warning .summary-count { color: #e17055; }
.summary-item.success .summary-count { color: var(--green); }
.summary-item.all .summary-count { color: var(--primary); }

.summary-label { font-size: 12px; color: #b2bec3; font-weight: 600; }

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }

.filter-group label {
  font-size: 11px;
  font-weight: 700;
  color: #b2bec3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-tabs { display: flex; gap: 4px; }

.filter-tab {
  padding: 6px 14px;
  border: 1.5px solid #eef1ff;
  border-radius: 20px;
  background: white;
  font-size: 12px;
  font-weight: 600;
  color: #b2bec3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.filter-tab:hover:not(.active) {
  border-color: var(--primary);
  color: var(--primary);
}

.form-control-sm {
  padding: 6px 12px;
  font-size: 13px;
  min-width: 160px;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input svg {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  stroke: #b2bec3;
  z-index: 1;
}

.search-input .form-control {
  padding-left: 32px;
}

.p0 { padding: 0; }

/* 告警单元格 */
.alert-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-cell-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-cell-icon svg { width: 18px; height: 18px; }
.alert-cell-icon.high { background: #fff0f6; stroke: var(--pink); }
.alert-cell-icon.high svg { stroke: var(--pink); }
.alert-cell-icon.mid { background: #fff8ed; }
.alert-cell-icon.mid svg { stroke: var(--yellow); }
.alert-cell-icon.low { background: var(--green-light); }
.alert-cell-icon.low svg { stroke: var(--green); }

.alert-cell-title { font-size: 13px; font-weight: 600; color: #2d3436; }
.alert-cell-sub { font-size: 11px; color: #b2bec3; margin-top: 2px; }

.device-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #636e72;
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 20px;
}

.device-tag svg { width: 12px; height: 12px; stroke: #b2bec3; }

.time-cell { font-size: 12px; color: #636e72; white-space: nowrap; }

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.level-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.level-badge.high { color: var(--pink); background: #fff0f6; }
.level-badge.high .level-dot { background: var(--pink); }
.level-badge.mid { color: #e17055; background: #fff8ed; }
.level-badge.mid .level-dot { background: #e17055; }
.level-badge.low { color: var(--green); background: var(--green-light); }
.level-badge.low .level-dot { background: var(--green); }

.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #b2bec3;
  font-size: 14px;
}

.empty-icon { font-size: 40px; margin-bottom: 12px; }

.table-row-anim { animation: row-in 0.3s ease backwards; }

@keyframes row-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
