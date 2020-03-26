import Vue from 'vue'
import AntUI from "ant-design-vue"
import "ant-design-vue/dist/antd.css";
import axios from 'axios'
import App from './App.vue'

import config from './config'
import store from './store'

Vue.use(AntUI)
Vue.config.productionTip = false

window.axios = axios.create({
  baseURL: config.base_url
})

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
