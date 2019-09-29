<template>
  <div id="app">
    <a-layout id="components-layout-demo-top" class="layout">
      <a-layout-header>
        <div class="logo" />
        <a-menu
                theme="dark"
                mode="horizontal"
                @click="menuClick"
                :defaultSelectedKeys="['3']"
                :style="{ lineHeight: '64px' }"
        >
          <a-menu-item key="1"><a-icon type="api" />连接管理</a-menu-item>
          <a-menu-item key="2"><a-icon type="database" />数据信息</a-menu-item>
          <a-menu-item key="3"><a-icon type="dashboard" />性能监控</a-menu-item>
          <a-sub-menu key="sub1">
            <span slot="title"><a-icon type="ordered-list" /><span>切换Redis</span></span>
            <a-menu-item v-for="item in containers" :key="item.value">{{item.label}}</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="redis_ip" disabled>
            <a-icon type="info-circle" />{{redis_ip}}
          </a-menu-item>
        </a-menu>
      </a-layout-header>
      <a-layout-content style="padding: 0 50px">
        <div v-show="memu_key=='3'">
          <a-row>
            <a-col :span="12">
              <div ref="chart" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
              <div ref="chart1" style="height:46vh; width:48vw"></div>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="12">
              <div ref="chart2" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
              <div ref="chart3" style="height:46vh; width:48vw"></div>
            </a-col>
          </a-row>
        </div>
<!--        <a-select :value="redis_db" @change="(value)=>{redis_db=value}" style="width: 120px">-->
<!--          <a-select-option v-for="item in dbs" :value="item.value" v-bind:key="item.value">{{item.label}}</a-select-option>-->
<!--        </a-select>-->

      </a-layout-content>
    </a-layout>
  </div>
</template>

<script>

import axios from "axios";
import echarts from 'echarts'

Date.prototype.Format = function(fmt){
  var o = {
    "M+": this.getMonth()+1,
    "d+": this.getDate(),
    "H+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "S+": this.getMilliseconds()
  };
  //因为date.getFullYear()出来的结果是number类型的,所以为了让结果变成字符串型，下面有两种方法：
  if(/(y+)/.test(fmt)){
    //第一种：利用字符串连接符“+”给date.getFullYear()+""，加一个空字符串便可以将number类型转换成字符串。
    fmt=fmt.replace(RegExp.$1,(this.getFullYear()+"").substr(4-RegExp.$1.length));
  }
  for(var k in o){
    if (new RegExp("(" + k +")").test(fmt)){
      //第二种：使用String()类型进行强制数据类型转换String(date.getFullYear())，这种更容易理解。
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'
let base_url = location.origin, ws_url = `${wsProtocol}//${location.host}/ws`

// let server = '47.52.140.130:8080'
// let base_url = `http://${server}`
// let ws_url = `ws://${server}/ws`

export default {
  name: "app",
  data() {
    return {
      // eslint-disable-next-line no-console
      log: console.log,
      url: base_url,
      ws_url: ws_url,
      redis_name: "",
      redis_ip: "",
      redis_db: 0,
      containers: [],
      dbs: [],
      memu_key: '',
      websocket: null,
      myChart: null,
      myChart1: null,
      myChart2: null,
      myChart3: null,
      time_data: [],
      info_data: [],
      option: {
        title: {
          text: '流量监控'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            animation: false
          }
        },
        axisPointer: {
          link: {xAxisIndex: 'all'}
        },
        grid: [{
          left: 50,
          right: 50,
          height: '32%'
        }, {
          left: 50,
          right: 50,
          top: '60%',
          height: '32%'
        }],
        xAxis: [
          {
            type : 'category',
            boundaryGap : false,
            axisLine: {onZero: true},
            data: []
          },
          {
            gridIndex: 1,
            type : 'category',
            boundaryGap : false,
            axisLine: {onZero: true},
            data: [],
            position: 'top'
          }
        ],
        yAxis : [
          {
            name : '上行流量(Kbps/s)',
            type : 'value',
          },
          {
            gridIndex: 1,
            name : '下行流量(Kbps/s)',
            type : 'value',
            inverse: true
          }
        ],
        series: [
          {
            name:'上行流量',
            type:'line',
            symbolSize: 8,
            hoverAnimation: false,
            data: []
          },
          {
            name:'下行流量',
            type:'line',
            xAxisIndex: 1,
            yAxisIndex: 1,
            symbolSize: 8,
            hoverAnimation: false,
            data: []
          }
        ]
      },
      option1: {
        title: {
          text: '内存监控'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: []
        },
        yAxis: {
          name : '内存占用(KB)',
          type: 'value'
        },
        grid: {
          left: 0,
          right: 0,
          bottom: 0,
          containLabel: true
        },
        series: [{
          data: [],
          type: 'line',
          smooth: true
        }]
      },
      option2: {
        title: {
          text: '每秒执行操作数'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: []
        },
        yAxis: {
          type: 'value'
        },
        grid: {
          left: 20,
          right: 20,
          containLabel: true
        },
        series: [{
          data: [],
          type: 'line',
          smooth: true
        }]
      },
      option3: {
        title: {
          text: 'CPU监控'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: []
        },
        yAxis: {
          type: 'value'
        },
        grid: {
          left: 20,
          right: 20,
          containLabel: true
        },
        series: [{
          data: [],
          type: 'line',
          smooth: true
        }]
      }
    }
  },
  methods: {
    menuClick(value) {
      if (value.key.length < 5) {
        this.memu_key = value.key
      } else {
        this.redis_ip = value.key
        // axios.get(this.url + '/containers?method=info&ip=' + this.redis_ip)
        //   .then(result => {
        //     let data = result.data.data;
        //     this.log(data)
        //   })
      }
      if (this.memu_key == 3) {
        this.websocket.send(JSON.stringify({
          'type': 1, 'ip': this.redis_ip
        }));
      }
    },
    onChange(value) {
      this.log(`selected ${value}`)
    },
    receiveData(e) {
      const redata = JSON.parse(e.data);
      const ip = redata.msg
      if (ip !== this.redis_ip) return

      const data = JSON.parse(redata.data)
      this.log(data)

      let now = new Date().Format("HH:mm:ss")
      this.time_data.push(now)

      this.option.xAxis[0].data = this.time_data
      this.option.xAxis[1].data = this.time_data
      this.option.series[0].data.push(data['instantaneous_input_kbps'])
      this.option.series[1].data.push(data['instantaneous_output_kbps'])
      this.myChart.setOption(this.option);

      this.option1.xAxis.data = this.time_data
      this.option1.series[0].data.push(data['used_memory'] / 1024)
      this.myChart1.setOption(this.option1);

      this.option2.xAxis.data = this.time_data
      this.option2.series[0].data.push(data['instantaneous_ops_per_sec'])
      this.myChart2.setOption(this.option2);

      this.option3.xAxis.data = this.time_data
      this.option3.series[0].data.push(data['used_cpu_user'])
      this.myChart3.setOption(this.option3);
    }
  },
  created() {
    for (let i = 0; i < 16; i++) {
      this.dbs.push({
        label: i,
        value: i
      });
    }
    axios.get(this.url + "/containers?method=list").then(result => {
      let data = result.data.data;
      for (let c in data) {
        if (this.redis_ip === "") {
          this.redis_ip = data[c]["Ip"];
          this.redis_name = data[c]["Name"];
        }
        this.containers.push({
          label: data[c]["Name"],
          value: data[c]["Ip"]
        });
      }
    });

    let websocket = new WebSocket(this.ws_url)
    websocket.onopen = () => this.log("WebSocket连接成功")
    websocket.onerror = () => this.log("WebSocket连接发生错误")
    websocket.onclose = (e) => this.log(`connection closed (${e})`)
    websocket.onmessage = (e) => this.receiveData(e)
    this.websocket = websocket
  },
  mounted() {
    if (this.myChart == null)
        this.myChart = echarts.init(this.$refs.chart)
    this.myChart.setOption(this.option);
    if (this.myChart1 == null)
      this.myChart1 = echarts.init(this.$refs.chart1)
    this.myChart1.setOption(this.option1);
    if (this.myChart2 == null)
      this.myChart2 = echarts.init(this.$refs.chart2)
    this.myChart2.setOption(this.option2);
    if (this.myChart3 == null)
      this.myChart3 = echarts.init(this.$refs.chart3)
    this.myChart3.setOption(this.option3);
  }
};
</script>

<style>
  #components-layout-demo-top .logo {
    width: 93px;
    height: 31px;
    background: url("assets/redis-white.png") no-repeat;
    background-size: 100%;
    margin: 16px 24px 16px 0;
    float: left;
  }
</style>
