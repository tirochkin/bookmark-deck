// Entry point for the Chrome extension overlay
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../style.css'
import './extension.css'
import ExtensionApp from './ExtensionApp.vue'

const app = createApp(ExtensionApp)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
