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
              <th>截图</th>
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
                <img v-if="alert.face_image" :src="alert.face_image" class="alert-thumb" @click="viewAlert(alert)" />
                <span v-else class="no-thumb">无截图</span>
              </td>
              <td>
                <div class="alert-cell">
                  <div>
                    <div class="alert-cell-title">{{ alert.title }}</div>
                    <div class="alert-cell-sub">{{ alert.description }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="device-tag">{{ alert.device }}</div>
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
                  <button v-if="alert.rawStatus === 'pending'" class="btn btn-success btn-sm" @click="openHandleDialog(alert)">处理</button>
                  <button v-if="alert.rawStatus === 'pending'" class="btn btn-warning btn-sm" @click="ignoreAlert(alert)">忽略</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAlerts.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-icon">🎉</div>
                <div>暂无告警记录</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 告警详情/处理弹窗 -->
    <el-dialog v-model="showAlertDialog" :title="dialogAlert ? '告警详情' : ''" width="600px">
      <div v-if="dialogAlert" class="alert-detail">
        <div class="ad-image" v-if="dialogAlert.face_image">
          <img :src="dialogAlert.face_image" style="max-width:100%;border-radius:8px" />
        </div>
        <div class="ad-rows">
          <div class="ad-row"><span class="ad-label">标题</span><span>{{ dialogAlert.title }}</span></div>
          <div class="ad-row"><span class="ad-label">描述</span><span>{{ dialogAlert.description }}</span></div>
          <div class="ad-row"><span class="ad-label">设备</span><span>{{ dialogAlert.device }}</span></div>
          <div class="ad-row"><span class="ad-label">情绪</span><span>{{ dialogAlert.emotion || '-' }}</span></div>
          <div class="ad-row"><span class="ad-label">持续时间</span><span>{{ dialogAlert.duration || 0 }}秒</span></div>
          <div class="ad-row"><span class="ad-label">时间</span><span>{{ dialogAlert.time }}</span></div>
          <div class="ad-row"><span class="ad-label">状态</span><span class="badge" :class="dialogAlert.badgeClass">{{ dialogAlert.status }}</span></div>
          <div class="ad-row" v-if="dialogAlert.handle_note"><span class="ad-label">处理备注</span><span>{{ dialogAlert.handle_note }}</span></div>
        </div>
        <div v-if="dialogAlert.rawStatus === 'pending'" class="ad-handle">
          <el-input v-model="handleNote" type="textarea" :rows="3" placeholder="输入处理备注（可选）" style="margin-bottom:12px"></el-input>
          <div style="display:flex;gap:8px">
            <el-button type="primary" @click="submitHandle">确认处理</el-button>
            <el-button @click="showAlertDialog = false">取消</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
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
      description: a.description || '',
      device: a.device || '未知设备',
      face_image: a.face_image || null,
      emotion: a.emotion || '',
      duration: a.duration || 0,
      time: formatDateTime(a.time),
      level: levelMap[a.level] || 'low',
      levelText: levelTextMap[a.level] || a.level,
      status: statusTextMap[a.status] || a.status,
      rawStatus: a.status,
      badgeClass: badgeClassMap[a.status] || 'badge-warning',
      type: a.type,
      handle_note: a.handle_note || '',
      handled_by: a.handled_by || '',
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

const showAlertDialog = ref(false);
const dialogAlert = ref(null);
const handleNote = ref('');

const openHandleDialog = (alert) => {
  dialogAlert.value = alert;
  handleNote.value = '';
  showAlertDialog.value = true;
};

const viewAlert = (alert) => {
  dialogAlert.value = alert;
  handleNote.value = '';
  showAlertDialog.value = true;
};

const submitHandle = async () => {
  if (!dialogAlert.value) return;
  try {
    await alertsApi.handleAlert(dialogAlert.value.id, handleNote.value);
    dialogAlert.value.rawStatus = 'handled';
    dialogAlert.value.status = '已处理';
    dialogAlert.value.badgeClass = 'badge-success';
    dialogAlert.value.handle_note = handleNote.value;
    showAlertDialog.value = false;
    ElMessage.success('处理成功');
  } catch (e) {
    ElMessage.error('处理失败');
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

.page-sub strong { color: #e84393; }

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
.summary-item.danger { border-color: #eef1ff; background: #fafbff; }
.summary-item.warning { border-color: #eef1ff; background: #fafbff; }
.summary-item.success { border-color: #eef1ff; background: #fafbff; }
.summary-item.all { border-color: #eef1ff; background: #fafbff; }

.summary-count {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
}

.summary-item.danger .summary-count { color: #e84393; }
.summary-item.warning .summary-count { color: #e17055; }
.summary-item.success .summary-count { color: #00b894; }
.summary-item.all .summary-count { color: #6c8ef0; }

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
  background: #6c8ef0;
  border-color: #6c8ef0;
  color: white;
}

.filter-tab:hover:not(.active) {
  border-color: #6c8ef0;
  color: #6c8ef0;
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
.alert-cell-icon.high { background: #fff0f6; }
.alert-cell-icon.high svg { stroke: #e84393; }
.alert-cell-icon.mid { background: #fff8ed; }
.alert-cell-icon.mid svg { stroke: #e17055; }
.alert-cell-icon.low { background: #e0f5ee; }
.alert-cell-icon.low svg { stroke: #00b894; }

.alert-cell-title { font-size: 13px; font-weight: 600; color: #2d3436; }
.alert-cell-sub { font-size: 11px; color: #b2bec3; margin-top: 2px; }
.alert-thumb {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eef1ff;
  cursor: pointer;
}
.no-thumb { font-size: 12px; color: #b2bec3; }

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

.level-badge.high { color: #e84393; background: #fff0f6; }
.level-badge.high .level-dot { background: #e84393; }
.level-badge.mid { color: #e17055; background: #fff8ed; }
.level-badge.mid .level-dot { background: #e17055; }
.level-badge.low { color: #00b894; background: #e0f5ee; }
.level-badge.low .level-dot { background: #00b894; }

.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #b2bec3;
  font-size: 14px;
}

.empty-icon { font-size: 40px; margin-bottom: 12px; }

.table-row-anim { animation: row-in 0.3s ease backwards; }
.alert-detail { display: flex; flex-direction: column; gap: 12px; }
.ad-rows { display: flex; flex-direction: column; gap: 8px; }
.ad-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: start;
  font-size: 13px;
}
.ad-label { color: #636e72; }
.ad-handle { margin-top: 6px; }

@keyframes row-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
