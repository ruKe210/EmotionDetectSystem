import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/fresh-theme.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 在挂载前恢复用户状态
import { useSystemStore } from './store/modules/systemStore'
const systemStore = useSystemStore()
systemStore.initSystem()

app.mount('#app')
