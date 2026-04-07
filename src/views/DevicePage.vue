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
        <button class="btn btn-secondary btn-sm" @click="refreshAll">刷新</button>
        <button class="btn btn-primary" @click="openAddModal">添加设备</button>
      </div>
    </div>

    <!-- 设备概览 -->
    <div class="device-overview">
      <div class="overview-card total">
        <div class="ov-count">{{ devices.length }}</div>
        <div class="ov-label">设备总数</div>
      </div>
      <div class="overview-card online">
        <div class="ov-count">{{ onlineCount }}</div>
        <div class="ov-label">在线设备</div>
      </div>
      <div class="overview-card offline">
        <div class="ov-count">{{ devices.length - onlineCount }}</div>
        <div class="ov-label">离线设备</div>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="card">
      <div class="card-header"><h4>设备列表</h4></div>
      <div class="card-body p0">
        <table class="fresh-table">
          <thead>
            <tr>
              <th>设备名称</th>
              <th>类型</th>
              <th>IP / 索引</th>
              <th>分辨率</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in devices" :key="device.id">
              <td><strong>{{ device.name }}</strong><br/><span style="font-size:11px;color:#b2bec3">{{ device.id }}</span></td>
              <td><span class="type-tag">{{ device.type === 'rtsp' ? 'RTSP' : 'USB' }}</span></td>
              <td class="ip-cell">{{ device.type === 'rtsp' ? device.ip : `索引 ${device.source_index}` }}</td>
              <td>{{ device.resolution || '-' }}</td>
              <td>
                <div class="status-indicator" :class="device.status">
                  <span class="status-dot-sm"></span>
                  {{ device.status === 'online' ? '在线' : '离线' }}
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-success btn-sm" v-if="device.status === 'offline'" @click="toggleDevice(device)">启动</button>
                  <button class="btn btn-warning btn-sm" v-else @click="toggleDevice(device)">停止</button>
                  <button class="btn btn-danger btn-sm" @click="deleteDevice(device)">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="devices.length === 0">
              <td colspan="6" style="text-align:center;padding:40px;color:#b2bec3">暂无设备，点击"添加设备"开始</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 添加设备弹窗 -->
    <el-dialog v-model="showAddModal" title="添加摄像头" width="560px" :close-on-click-modal="false">
      <!-- 步骤一：选择类型 -->
      <div v-if="addStep === 1" class="add-step">
        <p style="margin-bottom:16px;color:#636e72">选择摄像头类型：</p>
        <div class="type-selector">
          <div class="type-option" :class="{ active: addForm.type === 'usb' }" @click="addForm.type = 'usb'">
            <div class="type-icon">🖥️</div>
            <div>USB 摄像头</div>
            <div class="type-desc">本机连接的摄像头</div>
          </div>
          <div class="type-option" :class="{ active: addForm.type === 'rtsp' }" @click="addForm.type = 'rtsp'">
            <div class="type-icon">📡</div>
            <div>网络摄像头</div>
            <div class="type-desc">局域网 RTSP 摄像头</div>
          </div>
        </div>
      </div>

      <!-- 步骤二 USB：输入名称和索引 -->
      <div v-if="addStep === 2 && addForm.type === 'usb'" class="add-step">
        <el-form label-width="100px">
          <el-form-item label="摄像头名称">
            <el-input v-model="addForm.name" placeholder="如：笔记本摄像头" />
          </el-form-item>
          <el-form-item label="设备索引">
            <el-input-number v-model="addForm.source_index" :min="0" :max="10" />
            <span style="margin-left:8px;font-size:12px;color:#909399">通常 0 = 内置摄像头</span>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤二 RTSP：扫描局域网 -->
      <div v-if="addStep === 2 && addForm.type === 'rtsp'" class="add-step">
        <div v-if="scanning" style="text-align:center;padding:30px">
          <div class="loading-spinner" style="margin:0 auto 12px"></div>
          <p>正在扫描局域网 {{ scanSubnet }} ...</p>
        </div>
        <div v-else-if="scanResults.length > 0">
          <p style="margin-bottom:12px;color:#636e72">发现 {{ scanResults.length }} 个可能的摄像头设备：</p>
          <div class="scan-list">
            <div
              v-for="ip in scanResults" :key="ip"
              class="scan-item" :class="{ active: addForm.ip === ip }"
              @click="addForm.ip = ip"
            >
              <span class="scan-ip">{{ ip }}</span>
              <span v-if="addForm.ip === ip" style="color:var(--green)">✓ 已选</span>
            </div>
          </div>
          <div style="margin-top:12px">
            <el-input v-model="addForm.ip" placeholder="或手动输入 IP 地址" size="small" />
          </div>
        </div>
        <div v-else>
          <p style="color:#909399;margin-bottom:12px">未发现设备，请手动输入 IP：</p>
          <el-input v-model="addForm.ip" placeholder="如 192.168.8.156" />
        </div>
      </div>

      <!-- 步骤三 RTSP：输入账号密码 -->
      <div v-if="addStep === 3 && addForm.type === 'rtsp'" class="add-step">
        <el-form label-width="100px">
          <el-form-item label="摄像头名称">
            <el-input v-model="addForm.name" :placeholder="`网络摄像头-${addForm.ip}`" />
          </el-form-item>
          <el-form-item label="IP 地址">
            <el-input v-model="addForm.ip" disabled />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="addForm.rtsp_username" placeholder="admin" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="addForm.rtsp_password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
        </el-form>
        <div v-if="testResult" style="margin-top:12px">
          <el-alert :title="testResult.success ? `连接成功 (${testResult.resolution})` : '连接失败'" :type="testResult.success ? 'success' : 'error'" show-icon :closable="false" />
        </div>
        <el-button type="primary" :loading="testing" @click="testConnection" style="margin-top:12px">
          {{ testing ? '测试中...' : '测试连接' }}
        </el-button>
      </div>

      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button v-if="addStep > 1" @click="addStep--">上一步</el-button>
        <el-button v-if="canGoNext" type="primary" @click="nextStep">
          {{ isLastStep ? '确认添加' : '下一步' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { devicesApi } from '../api/devices';

const devices = ref([]);
const showAddModal = ref(false);
const addStep = ref(1);
const scanning = ref(false);
const scanSubnet = ref('');
const scanResults = ref([]);
const testing = ref(false);
const testResult = ref(null);

const addForm = ref({
  type: 'usb',
  name: '',
  ip: '',
  rtsp_username: 'admin',
  rtsp_password: '',
  source_index: 0,
});

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length);

const isLastStep = computed(() => {
  if (addForm.value.type === 'usb') return addStep.value === 2;
  return addStep.value === 3;
});

const canGoNext = computed(() => {
  if (addStep.value === 1) return true;
  if (addForm.value.type === 'usb' && addStep.value === 2) return true;
  if (addForm.value.type === 'rtsp' && addStep.value === 2) return !!addForm.value.ip;
  if (addForm.value.type === 'rtsp' && addStep.value === 3) return !!addForm.value.rtsp_password;
  return false;
});

const openAddModal = () => {
  addStep.value = 1;
  addForm.value = { type: 'usb', name: '', ip: '', rtsp_username: 'admin', rtsp_password: '', source_index: 0 };
  testResult.value = null;
  scanResults.value = [];
  showAddModal.value = true;
};

const nextStep = async () => {
  if (isLastStep.value) {
    await submitAdd();
    return;
  }
  addStep.value++;
  // 进入 RTSP 步骤2 时自动扫描
  if (addForm.value.type === 'rtsp' && addStep.value === 2) {
    await scanNetwork();
  }
};

const scanNetwork = async () => {
  scanning.value = true;
  scanResults.value = [];
  try {
    const res = await devicesApi.scanNetwork();
    scanResults.value = res.data.devices || [];
    scanSubnet.value = res.data.subnet || '';
  } catch (e) {
    console.error('扫描失败:', e);
  } finally {
    scanning.value = false;
  }
};

const testConnection = async () => {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await devicesApi.testRtsp({
      ip: addForm.value.ip,
      username: addForm.value.rtsp_username,
      password: addForm.value.rtsp_password,
    });
    testResult.value = { success: true, resolution: res.data.resolution, rtsp_url: res.data.rtsp_url };
  } catch (e) {
    testResult.value = { success: false };
  } finally {
    testing.value = false;
  }
};

const submitAdd = async () => {
  try {
    const form = addForm.value;
    const payload = {
      name: form.name || (form.type === 'rtsp' ? `网络摄像头-${form.ip}` : `USB摄像头-${form.source_index}`),
      type: form.type,
      ip: form.type === 'rtsp' ? form.ip : null,
      rtsp_username: form.type === 'rtsp' ? form.rtsp_username : null,
      rtsp_password: form.type === 'rtsp' ? form.rtsp_password : null,
      rtsp_url: testResult.value?.rtsp_url || null,
      source_index: form.type === 'usb' ? form.source_index : 0,
      resolution: testResult.value?.resolution || '640x480',
    };
    await devicesApi.createCamera(payload);
    ElMessage.success('添加成功');
    showAddModal.value = false;
    loadDevices();
  } catch (e) {
    ElMessage.error('添加失败: ' + (e.message || e));
  }
};

const toggleDevice = async (device) => {
  try {
    const res = await devicesApi.toggleCamera(device.id);
    device.status = res.data.status;
    ElMessage.success(device.status === 'online' ? '已启动' : '已停止');
    loadDevices();
  } catch (e) {
    ElMessage.error('操作失败: ' + (e.message || e));
  }
};

const deleteDevice = async (device) => {
  try {
    await ElMessageBox.confirm(`确定要删除 ${device.name} 吗？`, '提示', { type: 'warning' });
    await devicesApi.deleteCamera(device.id);
    devices.value = devices.value.filter(d => d.id !== device.id);
    ElMessage.success('删除成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

const loadDevices = async () => {
  try {
    const res = await devicesApi.getCameraList();
    devices.value = (res.data || []).map(cam => ({
      ...cam,
      type: cam.type || 'usb',
    }));
  } catch (e) {
    console.error('加载设备列表失败:', e);
  }
};

const refreshAll = () => loadDevices();

onMounted(() => loadDevices());
</script>

<style scoped>
.device-page { animation: fade-up 0.3s ease; }
@keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-header-left { display:flex; align-items:center; gap:14px; }
.page-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
.page-icon svg { width:24px; height:24px; }
.page-title { font-size:20px; font-weight:800; color:#2d3436; }
.page-sub { font-size:13px; color:#b2bec3; margin-top:2px; }
.page-sub strong { color:var(--primary); }
.page-actions { display:flex; gap:10px; }

.device-overview { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
.overview-card { background:white; border-radius:12px; padding:20px; text-align:center; border:2px solid transparent; }
.overview-card.total { border-color:#eef1ff; }
.overview-card.online { border-color:#e0f5ee; }
.overview-card.offline { border-color:#f0f0f0; }
.ov-count { font-size:32px; font-weight:800; margin-bottom:4px; }
.overview-card.total .ov-count { color:var(--primary); }
.overview-card.online .ov-count { color:var(--green); }
.overview-card.offline .ov-count { color:#b2bec3; }
.ov-label { font-size:12px; color:#b2bec3; font-weight:600; }

.p0 { padding:0; }
.type-tag { background:var(--lavender-light); color:var(--lavender); font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
.ip-cell { font-family:'Courier New',monospace; font-size:12px; color:#636e72; }
.status-indicator { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:4px 10px; border-radius:20px; }
.status-dot-sm { width:6px; height:6px; border-radius:50%; }
.status-indicator.online { color:var(--green); background:var(--green-light); }
.status-indicator.online .status-dot-sm { background:var(--green); }
.status-indicator.offline { color:#b2bec3; background:#f8f9fa; }
.status-indicator.offline .status-dot-sm { background:#b2bec3; }
.action-btns { display:flex; gap:6px; }

/* 添加弹窗 */
.add-step { min-height:120px; }
.type-selector { display:flex; gap:16px; }
.type-option {
  flex:1; padding:20px; border:2px solid #eef1ff; border-radius:12px; text-align:center;
  cursor:pointer; transition:all 0.2s;
}
.type-option:hover { border-color:var(--primary); }
.type-option.active { border-color:var(--primary); background:var(--primary-light); }
.type-icon { font-size:32px; margin-bottom:8px; }
.type-desc { font-size:12px; color:#b2bec3; margin-top:4px; }

.scan-list { max-height:200px; overflow-y:auto; }
.scan-item {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 14px; border:1.5px solid #eef1ff; border-radius:8px;
  margin-bottom:6px; cursor:pointer; transition:all 0.2s;
}
.scan-item:hover { border-color:var(--primary); }
.scan-item.active { border-color:var(--primary); background:var(--primary-light); }
.scan-ip { font-family:'Courier New',monospace; font-weight:700; }

.loading-spinner {
  width:32px; height:32px; border:3px solid #eef1ff; border-top-color:var(--primary);
  border-radius:50%; animation:spin 1s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }
</style>
