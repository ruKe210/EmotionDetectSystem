<template>
  <div class="device-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background: linear-gradient(135deg, #6c8ef0, #a29bfe)">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div>
          <div class="page-title">设备管理</div>
          <div class="page-sub">共 <strong>{{ devices.length }}</strong> 台设备 · <strong style="color: var(--green)">{{ onlineCount }}</strong> 在线</div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="refreshAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          刷新
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加设备
        </button>
      </div>
    </div>

    <!-- 设备状态卡片 -->
    <div class="device-overview">
      <div class="overview-card" v-for="ov in overviewStats" :key="ov.label" :class="ov.cls">
        <div class="ov-icon" v-html="ov.icon"></div>
        <div class="ov-count">{{ ov.count }}</div>
        <div class="ov-label">{{ ov.label }}</div>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="card">
      <div class="card-header">
        <h4>
          <span class="header-dot" style="background: var(--primary)"></span>
          设备列表
        </h4>
        <div class="view-toggle">
          <button class="toggle-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="toggle-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </div>
      <div class="card-body p0" v-if="viewMode === 'table'">
        <table class="fresh-table">
          <thead>
            <tr>
              <th>设备信息</th>
              <th>类型</th>
              <th>IP地址</th>
              <th>最后在线</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(device, i) in devices" :key="device.id" :style="{ animationDelay: i * 0.06 + 's' }" class="row-anim">
              <td>
                <div class="device-cell">
                  <div class="device-avatar" :class="device.status">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M23 7l-7 5 7 5V7z"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <div>
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-id">ID: #{{ device.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="type-tag">{{ device.type }}</span>
              </td>
              <td class="ip-cell">{{ device.ip }}</td>
              <td class="time-cell">{{ device.lastSeen }}</td>
              <td>
                <div class="status-indicator" :class="device.status">
                  <span class="status-dot-sm"></span>
                  {{ device.status === 'online' ? '在线' : '离线' }}
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-primary btn-sm" @click="editDevice(device)">编辑</button>
                  <button class="btn btn-success btn-sm" v-if="device.status === 'offline'" @click="toggleDevice(device)">开启</button>
                  <button class="btn btn-warning btn-sm" v-else @click="toggleDevice(device)">关闭</button>
                  <button class="btn btn-danger btn-sm" @click="deleteDevice(device)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 卡片视图 -->
      <div class="card-body" v-else>
        <div class="device-cards">
          <div class="device-card-item" v-for="device in devices" :key="device.id">
            <div class="dc-header" :class="device.status">
              <div class="dc-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div class="dc-status">
                <span class="status-dot-sm"></span>
                {{ device.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
            <div class="dc-body">
              <div class="dc-name">{{ device.name }}</div>
              <div class="dc-info"><span>类型</span>{{ device.type }}</div>
              <div class="dc-info"><span>IP</span>{{ device.ip }}</div>
              <div class="dc-info"><span>最后在线</span>{{ device.lastSeen }}</div>
            </div>
            <div class="dc-actions">
              <button class="btn btn-primary btn-sm" style="flex:1">编辑</button>
              <button class="btn btn-success btn-sm" v-if="device.status === 'offline'" style="flex:1" @click="toggleDevice(device)">开启</button>
              <button class="btn btn-warning btn-sm" v-else style="flex:1" @click="toggleDevice(device)">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { devicesApi } from '../api/devices';

const viewMode = ref('table');
const showAddModal = ref(false);
const loading = ref(false);

const devices = ref([]);

const loadDevices = async () => {
  loading.value = true;
  try {
    const res = await devicesApi.getCameraList();
    const list = res.data || [];
    devices.value = list.map(cam => ({
      id: cam.id,
      name: cam.name,
      type: cam.type === 'usb' ? 'USB摄像头' : '网络摄像头',
      ip: cam.ip || '-',
      status: cam.status,
      lastSeen: cam.last_seen ? formatRelativeTime(cam.last_seen) : '未知',
    }));
  } catch (error) {
    console.error('加载设备列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatRelativeTime = (timeStr) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
};

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length);

const overviewStats = computed(() => [
  {
    label: '设备总数',
    count: devices.value.length,
    cls: 'total',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
  },
  {
    label: '在线设备',
    count: onlineCount.value,
    cls: 'online',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
  },
  {
    label: '离线设备',
    count: devices.value.length - onlineCount.value,
    cls: 'offline',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`
  },
]);

const toggleDevice = async (device) => {
  try {
    const res = await devicesApi.toggleCamera(device.id);
    device.status = res.data.status;
    device.lastSeen = device.status === 'online' ? '刚刚' : device.lastSeen;
  } catch (error) {
    console.error('切换设备状态失败:', error);
    ElMessage.error('操作失败');
  }
};

const editDevice = (device) => console.log('edit', device);

const deleteDevice = async (device) => {
  try {
    await ElMessageBox.confirm(`确定要删除 ${device.name} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await devicesApi.deleteCamera(device.id);
    devices.value = devices.value.filter(d => d.id !== device.id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除设备失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const refreshAll = () => {
  loadDevices();
};

onMounted(() => {
  loadDevices();
});
</script>

<style scoped>
.device-page { animation: fade-up 0.3s ease; }

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
  box-shadow: 0 4px 12px rgba(108, 142, 240, 0.3);
}

.page-icon svg { width: 24px; height: 24px; }
.page-title { font-size: 20px; font-weight: 800; color: #2d3436; }
.page-sub { font-size: 13px; color: #b2bec3; margin-top: 2px; }
.page-sub strong { color: var(--primary); }
.page-actions { display: flex; gap: 10px; align-items: center; }

/* 设备概览 */
.device-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.overview-card:hover { transform: translateY(-2px); }
.overview-card.total { border-color: #eef1ff; background: #fafbff; }
.overview-card.online { border-color: #e0f5ee; background: #f5fffa; }
.overview-card.offline { border-color: #f0f0f0; background: #fafafa; }

.ov-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ov-icon :deep(svg) { width: 28px; height: 28px; }
.overview-card.total .ov-icon :deep(svg) { stroke: var(--primary); }
.overview-card.online .ov-icon :deep(svg) { stroke: var(--green); }
.overview-card.offline .ov-icon :deep(svg) { stroke: #b2bec3; }

.ov-count { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
.overview-card.total .ov-count { color: var(--primary); }
.overview-card.online .ov-count { color: var(--green); }
.overview-card.offline .ov-count { color: #b2bec3; }

.ov-label { font-size: 12px; color: #b2bec3; font-weight: 600; }

/* 视图切换 */
.view-toggle { display: flex; gap: 4px; }

.toggle-btn {
  width: 32px;
  height: 32px;
  border: 1.5px solid #eef1ff;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toggle-btn svg { width: 16px; height: 16px; stroke: #b2bec3; }
.toggle-btn.active { background: var(--primary); border-color: var(--primary); }
.toggle-btn.active svg { stroke: white; }

.header-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.p0 { padding: 0; }

/* 设备单元格 */
.device-cell { display: flex; align-items: center; gap: 12px; }

.device-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-avatar svg { width: 20px; height: 20px; }
.device-avatar.online { background: var(--primary-light); }
.device-avatar.online svg { stroke: var(--primary); }
.device-avatar.offline { background: #f0f0f0; }
.device-avatar.offline svg { stroke: #b2bec3; }

.device-name { font-size: 13px; font-weight: 700; color: #2d3436; }
.device-id { font-size: 11px; color: #b2bec3; margin-top: 2px; }

.type-tag {
  background: var(--lavender-light);
  color: var(--lavender);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.ip-cell { font-family: 'Courier New', monospace; font-size: 12px; color: #636e72; }
.time-cell { font-size: 12px; color: #b2bec3; }

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.status-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-indicator.online { color: var(--green); background: var(--green-light); }
.status-indicator.online .status-dot-sm { background: var(--green); animation: pulse 2s infinite; }
.status-indicator.offline { color: #b2bec3; background: #f8f9fa; }
.status-indicator.offline .status-dot-sm { background: #b2bec3; }

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.action-btns { display: flex; gap: 6px; }

.row-anim { animation: row-in 0.3s ease backwards; }
@keyframes row-in { from { opacity: 0; } to { opacity: 1; } }

/* 卡片视图 */
.device-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.device-card-item {
  border: 1.5px solid #eef1ff;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.device-card-item:hover {
  border-color: var(--primary);
  box-shadow: 0 8px 24px rgba(108, 142, 240, 0.12);
  transform: translateY(-3px);
}

.dc-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dc-header.online { background: linear-gradient(135deg, #eef1ff, #f4f3ff); }
.dc-header.offline { background: #f8f9fa; }

.dc-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dc-header.online .dc-avatar { background: var(--primary); }
.dc-header.offline .dc-avatar { background: #b2bec3; }
.dc-avatar svg { width: 24px; height: 24px; }

.dc-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.dc-header.online .dc-status { color: var(--green); background: rgba(0, 184, 148, 0.1); }
.dc-header.offline .dc-status { color: #b2bec3; background: white; }
.dc-header.online .dc-status .status-dot-sm { background: var(--green); }
.dc-header.offline .dc-status .status-dot-sm { background: #b2bec3; }

.dc-body { padding: 16px 20px; }
.dc-name { font-size: 16px; font-weight: 800; color: #2d3436; margin-bottom: 10px; }

.dc-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #636e72;
  padding: 4px 0;
  border-bottom: 1px solid #f8f9fa;
}

.dc-info span { color: #b2bec3; font-weight: 600; }

.dc-actions {
  padding: 12px 16px;
  border-top: 1px solid #f8f9fa;
  display: flex;
  gap: 8px;
}
</style>
