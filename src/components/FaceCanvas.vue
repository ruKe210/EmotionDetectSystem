<template>
  <div class="face-canvas-container">
    <div class="video-container" ref="videoContainer">
      <!-- 视频流显示 -->
      <img
        v-if="videoFrame"
        :src="videoFrame"
        class="video-stream"
        alt="视频流"
      />

      <!-- 人脸检测覆盖层 -->
      <canvas ref="canvas" class="face-canvas"></canvas>

      <!-- 加载状态：只在没有收到过任何帧时显示 -->
      <div v-if="!hasReceivedFrame" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>正在连接视频流...</span>
      </div>

      <!-- 错误状态 -->
      <div v-if="error && !hasReceivedFrame" class="error-overlay">
        <span>{{ error }}</span>
        <el-button type="primary" size="small" @click="reconnectAll" class="retry-btn">
          重新连接
        </el-button>
      </div>

      <!-- 状态信息 -->
      <div class="stream-info">
        <span class="fps">{{ fps }} FPS</span>
        <span class="latency">延迟: {{ latency }}ms</span>
        <span class="faces">人脸: {{ faceCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  cameraId: { type: String, default: '' },
  enableDetection: { type: Boolean, default: true },
})

const emit = defineEmits(['faceDetected', 'detectionError', 'connected', 'disconnected'])

const videoContainer = ref(null)
const canvas = ref(null)
const videoFrame = ref('')
const hasReceivedFrame = ref(false)
const error = ref('')
const fps = ref(0)
const latency = ref(0)
const faceCount = ref(0)

// --- WebSocket URL（走 Vite 代理，用当前 host） ---
function getWsUrl(path) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}${path}`
}

// --- 视频流 WebSocket ---
let videoWs = null
let videoReconnectTimer = null
let frameCount = 0
let lastFpsTime = Date.now()

function connectVideo() {
  if (videoWs) { try { videoWs.close() } catch (_) {} }
  error.value = ''

  const url = getWsUrl('/ws/video')
  videoWs = new WebSocket(url)

  videoWs.onopen = () => {
    console.log('[Video WS] 已连接')
    emit('connected')
  }

  videoWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'pong') return

      if (msg.type === 'video' && msg.frame) {
        videoFrame.value = `data:image/jpeg;base64,${msg.frame}`
        hasReceivedFrame.value = true

        frameCount++
        const now = Date.now()
        if (now - lastFpsTime >= 1000) {
          fps.value = frameCount
          frameCount = 0
          lastFpsTime = now
        }
        if (msg.timestamp) {
          latency.value = Math.max(0, Math.round(now - new Date(msg.timestamp).getTime()))
        }
      }
    } catch (_) {}
  }

  videoWs.onerror = () => {
    error.value = '视频流连接错误'
    emit('detectionError', '视频流连接错误')
  }

  videoWs.onclose = () => {
    console.log('[Video WS] 已断开')
    emit('disconnected')
    scheduleVideoReconnect()
  }
}

function scheduleVideoReconnect() {
  if (videoReconnectTimer) return
  videoReconnectTimer = setTimeout(() => {
    videoReconnectTimer = null
    connectVideo()
  }, 3000)
}

function disconnectVideo() {
  if (videoReconnectTimer) { clearTimeout(videoReconnectTimer); videoReconnectTimer = null }
  if (videoWs) { try { videoWs.close() } catch (_) {} videoWs = null }
}

// --- 人脸数据 WebSocket ---
let faceWs = null
let faceReconnectTimer = null

function connectFace() {
  if (faceWs) { try { faceWs.close() } catch (_) {} }

  const url = getWsUrl('/ws/face')
  faceWs = new WebSocket(url)

  faceWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'face' && msg.data) {
        const faces = msg.data.faces || []
        faceCount.value = faces.length
        if (canvas.value) drawFaceBoxes(faces)
        emit('faceDetected', faces)
      }
    } catch (_) {}
  }

  faceWs.onclose = () => {
    if (!faceReconnectTimer) {
      faceReconnectTimer = setTimeout(() => {
        faceReconnectTimer = null
        connectFace()
      }, 3000)
    }
  }

  faceWs.onerror = () => {}
}

function disconnectFace() {
  if (faceReconnectTimer) { clearTimeout(faceReconnectTimer); faceReconnectTimer = null }
  if (faceWs) { try { faceWs.close() } catch (_) {} faceWs = null }
}

// --- 重连所有 ---
function reconnectAll() {
  disconnectVideo()
  disconnectFace()
  hasReceivedFrame.value = false
  error.value = ''
  connectVideo()
  connectFace()
}

// --- 绘制人脸框 ---
function drawFaceBoxes(faces) {
  if (!canvas.value || !videoContainer.value) return
  const ctx = canvas.value.getContext('2d')
  const w = videoContainer.value.clientWidth
  const h = videoContainer.value.clientHeight
  canvas.value.width = w
  canvas.value.height = h
  ctx.clearRect(0, 0, w, h)
  // 人脸框已由后端绘制在视频帧上，这里不再重复绘制
}

// --- 生命周期 ---
onMounted(() => {
  connectVideo()
  connectFace()
})

onUnmounted(() => {
  disconnectVideo()
  disconnectFace()
})

watch(() => props.enableDetection, (val) => {
  if (val) {
    connectVideo()
    connectFace()
  } else {
    disconnectVideo()
    disconnectFace()
  }
})
</script>

<style scoped>
.face-canvas-container { width: 100%; height: 100%; }

.video-container {
  position: relative;
  width: 100%; height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-stream {
  width: 100%; height: 100%;
  object-fit: contain;
}

.face-canvas {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.loading-overlay,
.error-overlay {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: white; gap: 16px;
}

.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn { margin-top: 10px; }

.stream-info {
  position: absolute; top: 10px; right: 10px;
  display: flex; gap: 15px;
  background: rgba(0,0,0,0.6);
  padding: 8px 15px; border-radius: 20px;
  color: white; font-size: 12px; font-family: monospace;
}
.stream-info span { display: flex; align-items: center; gap: 5px; }
.fps { color: #67c23a; }
.latency { color: #e6a23c; }
.faces { color: #409eff; }
</style>