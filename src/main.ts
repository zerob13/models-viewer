import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import App from './App.vue'
import 'xp.css/dist/XP.css'
import './style.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(PiniaColada)

app.mount('#app')
