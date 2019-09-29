import Vue from 'vue'
import AntUI from "ant-design-vue"
import "ant-design-vue/dist/antd.css";
import App from './App.vue'

Vue.use(AntUI)
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
