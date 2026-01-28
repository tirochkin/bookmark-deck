// Entry point for the New Tab page
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../style.css'
import './newtab.css'
import NewTabApp from './NewTabApp.vue'

const app = createApp(NewTabApp)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
