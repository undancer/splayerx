import Vue from 'vue'
import { PiniaVuePlugin, createPinia } from 'pinia'

Vue.use(PiniaVuePlugin)

const store = createPinia()

export default store;
