<template>
  <div class="logs-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background: linear-gradient(135deg, #00cec9, #00b894)">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="page-title">日志管理</div>
          <div class="page-sub">共 <strong>{{ filteredLogs.length }}</strong> 条日志记录</div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="clearLogs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          清除日志
        </button>
        <button class="btn btn-primary btn-sm" @click="exportLogs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出日志
        </button>
      </div>
    </div>

    <!-- 日志统计 -->
    <div class="log-stats">
      <div class="log-stat-item" v-for="stat in logStats" :key="stat.label" :class="stat.cls">
        <div class="ls-icon" v-html="stat.icon"></div>
        <div class="ls-content">
          <div class="ls-count">{{ stat.count }}</div>
          <div class="ls-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="card">
      <div class="card-body filter-bar">
        <div class="filter-group">
          <label>日志类型</label>
          <div class="filter-tabs">
            <button
              v-for="tab in logTypeTabs"
              :key="tab.value"
              class="filter-tab"
              :class="{ active: activeType === tab.value, [tab.cls]: true }"
              @click="activeType = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <label>日期范围</label>
          <input type="date" class="form-control form-control-sm" v-model="filterDate" />
        </div>
        <div class="filter-group">
          <label>搜索关键词</label>
          <div class="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索日志内容..." v-model="searchText" class="form-control form-control-sm" />
          </div>
        </div>
        <div class="filter-group" style="align-self: flex-end">
          <button class="btn btn-secondary btn-sm" @click="clearFilters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 日志表格 -->
    <div class="card">
      <div class="card-body p0">
        <table class="fresh-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>操作人</th>
              <th>内容</th>
              <th>IP地址</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, i) in filteredLogs" :key="log.id" :style="{ animationDelay: i * 0.04 + 's' }" class="row-anim">
              <td class="time-col">
                <div class="log-time">{{ log.date }}</div>
                <div class="log-time-sub">{{ log.time }}</div>
              </td>
              <td>
                <div class="log-type-badge" :class="log.typeCls">
                  <div class="type-icon" v-html="log.typeIcon"></div>
                  {{ log.type }}
                </div>
              </td>
              <td>
                <div class="operator-cell">
                  <div class="op-avatar" :class="log.operatorCls">{{ log.operator.charAt(0).toUpperCase() }}</div>
                  <span>{{ log.operator }}</span>
                </div>
              </td>
              <td class="content-cell">{{ log.content }}</td>
              <td class="ip-cell">{{ log.ip }}</td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="5" class="empty-state">
                <div class="empty-icon">📋</div>
                <div>暂无日志记录</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="page-info">共 {{ filteredLogs.length }} 条</span>
        <div class="page-btns">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="page-num">{{ currentPage }}</span>
          <button class="page-btn" @click="currentPage++">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { logsApi } from '../api/logs';

const activeType = ref('all');
const filterDate = ref('');
const searchText = ref('');
const currentPage = ref(1);
const totalLogs = ref(0);
const loading = ref(false);

const logTypeTabs = [
  { label: '全部', value: 'all', cls: '' },
  { label: '操作日志', value: 'operation', cls: 'op' },
  { label: '系统日志', value: 'system', cls: 'sys' },
  { label: '错误日志', value: 'error', cls: 'alert' },
];

const typeNameMap = { operation: '操作日志', system: '系统日志', error: '错误日志' };
const typeClsMap = { operation: 'op', system: 'sys', error: 'alert' };
const operatorClsMap = { admin: 'purple', system: 'blue', user1: 'green', user2: 'red' };

const typeIcons = {
  op: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  sys: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const logs = ref([]);

const loadLogs = async () => {
  loading.value = true;
  try {
    const params = { page: currentPage.value, pageSize: 20 };
    if (activeType.value !== 'all') params.type = activeType.value;
    if (filterDate.value) params.date = filterDate.value;
    if (searchText.value) params.search = searchText.value;

    const res = await logsApi.getLogs(params);
    const items = res.data.list || [];
    totalLogs.value = res.data.total || 0;

    logs.value = items.map(l => {
      const typeCls = typeClsMap[l.type] || 'sys';
      return {
        id: l.id,
        date: l.date || '',
        time: l.time || '',
        type: typeNameMap[l.type] || l.type,
        rawType: l.type,
        typeCls: typeCls,
        typeIcon: typeIcons[typeCls] || typeIcons.sys,
        operator: l.operator || 'system',
        operatorCls: operatorClsMap[l.operator] || 'blue',
        content: l.content || '',
        ip: l.ip || '',
      };
    });
  } catch (error) {
    console.error('加载日志失败:', error);
  } finally {
    loading.value = false;
  }
};

const logStats = computed(() => [
  {
    label: '操作日志',
    count: logs.value.filter(l => l.rawType === 'operation').length,
    cls: 'op',
    icon: typeIcons.op
  },
  {
    label: '系统日志',
    count: logs.value.filter(l => l.rawType === 'system').length,
    cls: 'sys',
    icon: typeIcons.sys
  },
  {
    label: '错误日志',
    count: logs.value.filter(l => l.rawType === 'error').length,
    cls: 'alert',
    icon: typeIcons.alert
  },
  {
    label: '全部日志',
    count: totalLogs.value,
    cls: 'rec',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
  },
]);

const filteredLogs = computed(() => logs.value);

const clearFilters = () => {
  activeType.value = 'all';
  searchText.value = '';
  filterDate.value = '';
  currentPage.value = 1;
  loadLogs();
};

const exportLogs = () => console.log('export');

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有日志吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await logsApi.clearLogs();
    logs.value = [];
    totalLogs.value = 0;
    ElMessage.success('日志已清除');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除日志失败:', error);
    }
  }
};

watch([activeType, filterDate], () => {
  currentPage.value = 1;
  loadLogs();
});

let searchTimer = null;
watch(searchText, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    loadLogs();
  }, 300);
});

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.logs-page { animation: fade-up 0.3s ease; }

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
  box-shadow: 0 4px 12px rgba(0, 206, 201, 0.3);
}

.page-icon svg { width: 24px; height: 24px; }
.page-title { font-size: 20px; font-weight: 800; color: #2d3436; }
.page-sub { font-size: 13px; color: #b2bec3; margin-top: 2px; }
.page-sub strong { color: var(--mint); }
.page-actions { display: flex; gap: 10px; }

/* 日志统计 */
.log-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.log-stat-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.log-stat-item:hover { transform: translateY(-2px); }
.log-stat-item.op { border-color: #f0e6ff; }
.log-stat-item.sys { border-color: #eef1ff; }
.log-stat-item.rec { border-color: #e0f5ee; }
.log-stat-item.alert { border-color: #ffe0ec; }

.ls-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ls-icon :deep(svg) { width: 18px; height: 18px; }
.log-stat-item.op .ls-icon { background: #f0e6ff; }
.log-stat-item.op .ls-icon :deep(svg) { stroke: #6c5ce7; }
.log-stat-item.sys .ls-icon { background: #eef1ff; }
.log-stat-item.sys .ls-icon :deep(svg) { stroke: #6c8ef0; }
.log-stat-item.rec .ls-icon { background: #e0f5ee; }
.log-stat-item.rec .ls-icon :deep(svg) { stroke: #00b894; }
.log-stat-item.alert .ls-icon { background: #ffe0ec; }
.log-stat-item.alert .ls-icon :deep(svg) { stroke: #e84393; }

.ls-count { font-size: 22px; font-weight: 800; color: #2d3436; }
.ls-label { font-size: 11px; color: #b2bec3; font-weight: 600; }

/* 筛选 */
.filter-bar {
  display: flex;
  gap: 20px;
  align-items: flex-start;
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

.filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }

.filter-tab {
  padding: 5px 12px;
  border: 1.5px solid #eef1ff;
  border-radius: 20px;
  background: white;
  font-size: 12px;
  font-weight: 600;
  color: #b2bec3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab.active { background: var(--primary); border-color: var(--primary); color: white; }
.filter-tab:hover:not(.active) { border-color: var(--primary); color: var(--primary); }

.form-control-sm { padding: 6px 12px; font-size: 13px; min-width: 150px; }

.search-input { position: relative; display: flex; align-items: center; }

.search-input svg {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  stroke: #b2bec3;
  z-index: 1;
}

.search-input .form-control { padding-left: 30px; min-width: 200px; }

.p0 { padding: 0; }

/* 日志表格 */
.time-col { white-space: nowrap; }
.log-time { font-size: 12px; font-weight: 600; color: #636e72; font-variant-numeric: tabular-nums; }
.log-time-sub { font-size: 10px; color: #b2bec3; }

.log-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.log-type-badge :deep(svg) { width: 12px; height: 12px; }
.log-type-badge.op { background: var(--lavender-light); color: var(--lavender); }
.log-type-badge.op :deep(svg) { stroke: var(--lavender); }
.log-type-badge.sys { background: var(--primary-light); color: var(--primary); }
.log-type-badge.sys :deep(svg) { stroke: var(--primary); }
.log-type-badge.rec { background: var(--green-light); color: var(--green); }
.log-type-badge.rec :deep(svg) { stroke: var(--green); }
.log-type-badge.alert { background: var(--pink-light); color: var(--pink); }
.log-type-badge.alert :deep(svg) { stroke: var(--pink); }

.operator-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2d3436;
  font-weight: 600;
}

.op-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: white;
}

.op-avatar.purple { background: linear-gradient(135deg, var(--primary), var(--lavender)); }
.op-avatar.blue { background: linear-gradient(135deg, #74b9ff, var(--primary)); }
.op-avatar.green { background: linear-gradient(135deg, var(--mint), var(--green)); }
.op-avatar.red { background: linear-gradient(135deg, var(--pink), #e84393); }

.content-cell { font-size: 13px; color: #636e72; max-width: 300px; }
.ip-cell { font-family: 'Courier New', monospace; font-size: 12px; color: #b2bec3; }

.type-icon { display: inline-flex; }

/* 分页 */
.pagination-bar {
  padding: 14px 22px;
  border-top: 1px solid #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-info { font-size: 13px; color: #b2bec3; }
.page-btns { display: flex; align-items: center; gap: 8px; }

.page-btn {
  width: 30px;
  height: 30px;
  border: 1.5px solid #eef1ff;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) { background: var(--primary); border-color: var(--primary); }
.page-btn:hover:not(:disabled) svg { stroke: white; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn svg { width: 14px; height: 14px; stroke: #636e72; }
.page-num { font-size: 13px; font-weight: 700; color: #2d3436; padding: 0 4px; }

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #b2bec3;
  font-size: 14px;
}

.empty-icon { font-size: 40px; margin-bottom: 12px; }

.row-anim { animation: row-in 0.3s ease backwards; }
@keyframes row-in { from { opacity: 0; } to { opacity: 1; } }
</style>
