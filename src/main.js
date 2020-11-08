import Vue from 'vue'
import AntUI from "ant-design-vue"
import "ant-design-vue/dist/antd.css"
import App from './App.vue'
import store from './store'

Vue.use(AntUI)
Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
