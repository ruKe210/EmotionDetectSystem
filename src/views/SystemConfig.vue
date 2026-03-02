<template>
  <div class="system-config">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="config-tabs">
        <!-- 视频采集参数配置 -->
        <el-tab-pane label="视频采集参数" name="video">
          <el-form :model="videoConfig" label-width="120px" class="config-form">
            <el-form-item label="摄像头选择">
              <el-select v-model="videoConfig.cameraId" placeholder="请选择摄像头">
                <el-option 
                  v-for="camera in cameras" 
                  :key="camera.id" 
                  :label="camera.name" 
                  :value="camera.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="分辨率">
              <el-select v-model="videoConfig.resolution" placeholder="请选择分辨率">
                <el-option label="720P (1280x720)" value="720p" />
                <el-option label="480P (640x480)" value="480p" />
                <el-option label="360P (480x360)" value="360p" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="帧率">
              <el-select v-model="videoConfig.fps" placeholder="请选择帧率">
                <el-option label="15fps" value="15" />
                <el-option label="24fps" value="24" />
                <el-option label="30fps" value="30" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="采集时长">
              <el-input-number 
                v-model="videoConfig.duration" 
                :min="1" 
                :max="60" 
                label="分钟"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 识别参数配置 -->
        <el-tab-pane label="识别参数" name="recognition">
          <el-form :model="recognitionConfig" label-width="120px" class="config-form">
            <el-form-item label="情绪模型">
              <el-select v-model="recognitionConfig.modelType" placeholder="请选择情绪模型">
                <el-option label="离散情绪模型" value="discrete" />
                <el-option label="二维环形情感模型" value="2d" />
                <el-option label="三维情感模型" value="3d" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="识别延迟阈值">
              <el-input-number 
                v-model="recognitionConfig.delayThreshold" 
                :min="100" 
                :max="1000" 
                :step="50" 
                label="毫秒"
              />
            </el-form-item>
            
            <el-form-item label="精度阈值">
              <el-slider 
                v-model="recognitionConfig.accuracyThreshold" 
                :min="0.5" 
                :max="0.95" 
                :step="0.05"
              />
              <span class="value-desc">{{ recognitionConfig.accuracyThreshold }}</span>
            </el-form-item>
            
            <el-form-item label="情绪突变阈值">
              <el-slider 
                v-model="recognitionConfig.emotionChangeThreshold" 
                :min="0.1" 
                :max="0.5" 
                :step="0.05"
              />
              <span class="value-desc">{{ recognitionConfig.emotionChangeThreshold }}</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 存储参数配置 -->
        <el-tab-pane label="存储参数" name="storage">
          <el-form :model="storageConfig" label-width="120px" class="config-form">
            <el-form-item label="存储路径">
              <el-input v-model="storageConfig.path" placeholder="请输入存储路径" />
            </el-form-item>
            
            <el-form-item label="存储周期">
              <el-input-number 
                v-model="storageConfig.period" 
                :min="1" 
                :max="365" 
                label="天"
              />
            </el-form-item>
            
            <el-form-item label="自动备份">
              <el-switch v-model="storageConfig.autoBackup" />
            </el-form-item>
            
            <el-form-item label="备份频率">
              <el-select v-model="storageConfig.backupFrequency" placeholder="请选择备份频率">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 用户权限配置 -->
        <el-tab-pane label="用户权限" name="permission">
          <el-form :model="permissionConfig" label-width="120px" class="config-form">
            <el-form-item label="用户角色">
              <el-select v-model="permissionConfig.role" placeholder="请选择用户角色">
                <el-option label="管理员" value="admin" />
                <el-option label="操作员" value="operator" />
                <el-option label="查看员" value="viewer" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="操作权限">
              <el-checkbox-group v-model="permissionConfig.permissions">
                <el-checkbox label="参数配置" />
                <el-checkbox label="数据导出" />
                <el-checkbox label="告警处理" />
                <el-checkbox label="设备管理" />
                <el-checkbox label="用户管理" />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <div class="config-actions">
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
        <el-button @click="resetConfig">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { devicesApi } from '../api/devices';
import service from '../api/request';

const router = useRouter();
const activeTab = ref('video');
const cameras = ref([]);

// 视频采集配置
const videoConfig = reactive({
  cameraId: '',
  resolution: '480p',
  fps: 15,
  duration: 10
});

// 识别参数配置
const recognitionConfig = reactive({
  modelType: 'discrete',
  delayThreshold: 200,
  accuracyThreshold: 0.7,
  emotionChangeThreshold: 0.2
});

// 存储参数配置
const storageConfig = reactive({
  path: './data',
  period: 30,
  autoBackup: true,
  backupFrequency: 'weekly'
});

// 用户权限配置
const permissionConfig = reactive({
  role: 'admin',
  permissions: ['参数配置', '数据导出', '告警处理', '设备管理', '用户管理']
});

// 获取摄像头列表
const loadCameras = async () => {
  try {
    const response = await devicesApi.getCameraList();
    cameras.value = response.data || [];
    if (cameras.value.length > 0 && !videoConfig.cameraId) {
      videoConfig.cameraId = cameras.value[0].id;
    }
  } catch (error) {
    ElMessage.error('获取摄像头列表失败');
    console.error('Error loading cameras:', error);
  }
};

// 加载系统配置
const loadConfig = async () => {
  try {
    const response = await service.get('/config');
    const data = response.data || {};
    if (data.video) Object.assign(videoConfig, data.video);
    if (data.recognition) Object.assign(recognitionConfig, data.recognition);
    if (data.storage) Object.assign(storageConfig, data.storage);
    if (data.permission) Object.assign(permissionConfig, data.permission);
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 保存配置
const saveConfig = async () => {
  try {
    const config = {
      video: { ...videoConfig },
      recognition: { ...recognitionConfig },
      storage: { ...storageConfig },
      permission: { ...permissionConfig }
    };

    await service.post('/config', config);
    ElMessage.success('配置保存成功');
  } catch (error) {
    ElMessage.error('配置保存失败');
    console.error('Error saving config:', error);
  }
};

// 重置配置
const resetConfig = () => {
  videoConfig.cameraId = cameras.value.length > 0 ? cameras.value[0].id : '';
  videoConfig.resolution = '480p';
  videoConfig.fps = 15;
  videoConfig.duration = 10;

  recognitionConfig.modelType = 'discrete';
  recognitionConfig.delayThreshold = 200;
  recognitionConfig.accuracyThreshold = 0.7;
  recognitionConfig.emotionChangeThreshold = 0.2;

  storageConfig.path = './data';
  storageConfig.period = 30;
  storageConfig.autoBackup = true;
  storageConfig.backupFrequency = 'weekly';

  permissionConfig.role = 'admin';
  permissionConfig.permissions = ['参数配置', '数据导出', '告警处理', '设备管理', '用户管理'];
};

onMounted(() => {
  loadCameras();
  loadConfig();
});
</script>

<style scoped>
.system-config {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-tabs {
  margin-top: 20px;
}

.config-form {
  margin-top: 20px;
}

.value-desc {
  margin-left: 10px;
  color: #606266;
}

.config-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>