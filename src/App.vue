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
          <a-menu-item key="redis_info">
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
        <div v-show="memu_key=='redis_info'">
          <a-row>
            <a-col :span="16">
              <a-divider>高时延日志</a-divider>
              <a-table :columns="logs_columns" :dataSource="logs_data" bordered>
                <template slot="time" slot-scope="text">
                  {{new Date(text*1000).Format("yyyy-MM-dd HH:mm:ss")}}
                </template>
              </a-table>
              <a-divider>客户端列表</a-divider>
              <a-table :columns="clients_columns" :dataSource="clients_data" bordered></a-table>
            </a-col>
            <a-col :span="8">
              <a-collapse accordion activeKey="1" style="font-size: 15px">
                <a-collapse-panel key="1">
                  <template slot="header"><a-icon type="home" /> 服务端信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">版本信息: <a-tag color="green">{{info_data.redis_version}} | {{info_data.arch_bits}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">进程编号/端口: <a-tag color="green">{{info_data.process_id}} | {{info_data.tcp_port}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">运行时间: {{formatSeconds(info_data.uptime_in_seconds)}}</a-card-grid>
                    <a-card-grid class="gridcard">服务模式: {{info_data.redis_mode}}</a-card-grid>
                    <a-card-grid class="gridcard">系统版本: {{info_data.os}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="2">
                  <template slot="header"><a-icon type="user" /> 客户端信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">已连接客户端的数量: <a-tag color="green">{{info_data.connected_clients}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">阻塞的客户端的数量: <a-tag color="orange">{{info_data.blocked_clients}}</a-tag></a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="3">
                  <template slot="header"><a-icon type="bar-chart" /> 统计信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">已接受的连接请求数量: {{info_data.total_connections_received}}</a-card-grid>
                    <a-card-grid class="gridcard">已执行的命令数量: {{info_data.total_commands_processed}}</a-card-grid>
                    <a-card-grid class="gridcard">总流入数据量: {{info_data.total_net_input_bytes}}</a-card-grid>
                    <a-card-grid class="gridcard">总流出数据量: {{info_data.total_net_output_bytes}}</a-card-grid>
                    <a-card-grid class="gridcard">每秒流入数据量: {{info_data.instantaneous_input_kbps}}</a-card-grid>
                    <a-card-grid class="gridcard">每秒流出数据量: {{info_data.instantaneous_output_kbps}}</a-card-grid>
                    <a-card-grid class="gridcard">每秒执行命令数量: {{info_data.instantaneous_ops_per_sec}}</a-card-grid>
                    <a-card-grid class="gridcard">过期删除的键: {{info_data.expired_keys}}</a-card-grid>
                    <a-card-grid class="gridcard">驱逐(evict)的键数量: {{info_data.evicted_keys}}</a-card-grid>
                    <a-card-grid class="gridcard">查找数据库键成功的次数: {{info_data.keyspace_hits}}</a-card-grid>
                    <a-card-grid class="gridcard">订阅的频道数量: {{info_data.pubsub_channels}}</a-card-grid>
                    <a-card-grid class="gridcard">订阅的模式数量: {{info_data.pubsub_patterns}}</a-card-grid>
                    <a-card-grid class="gridcard">拒绝的连接请求数量: {{info_data.rejected_connections}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="4">
                  <template slot="header"><a-icon type="hdd" /> 持久信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">AOF是否处于打开状态: {{info_data.aof_enabled}}</a-card-grid>
                    <a-card-grid class="gridcard">AOF文件目前的大小: {{info_data.aof_current_size}}</a-card-grid>
                    <a-card-grid class="gridcard">RDB文件最近保存时间: <br> {{new Date(info_data.rdb_last_save_time*1000).Format("yyyy-MM-dd HH:mm:ss")}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="5">
                  <template slot="header"><a-icon type="table" /> 内存信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">系统内存: <a-tag color="green">{{info_data.total_system_memory_human}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">占用内存: <a-tag color="blue">{{info_data.used_memory_human}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">系统内存占用: {{info_data.used_memory_rss_human}}</a-card-grid>
                    <a-card-grid class="gridcard">内存消耗峰值: {{info_data.used_memory_peak_human}}</a-card-grid>
                    <a-card-grid class="gridcard">内存碎片率: {{info_data.mem_fragmentation_ratio}}</a-card-grid>
                    <a-card-grid class="gridcard">内存分配器: {{info_data.mem_allocator}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="6">
                  <template slot="header"><a-icon type="laptop" /> 处理器信息</template>
                  <a-card>
                    <a-card-grid class="gridcard">系统CPU: <a-tag color="green">{{info_data.used_cpu_sys}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">用户CPU: <a-tag color="blue">{{info_data.used_cpu_user}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">后台进程系统CPU: {{info_data.used_cpu_sys_children}}</a-card-grid>
                    <a-card-grid class="gridcard">后台进程用户CPU: {{info_data.used_cpu_user_children}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
                <a-collapse-panel key="7">
                  <template slot="header"><a-icon type="database" /> 键值信息</template>
                  <a-card>
                    <a-card-grid class="gridcard33">DB0: {{format_db_nums(info_data.db0)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB1: {{format_db_nums(info_data.db1)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB2: {{format_db_nums(info_data.db2)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB3: {{format_db_nums(info_data.db3)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB4: {{format_db_nums(info_data.db4)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB5: {{format_db_nums(info_data.db5)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB6: {{format_db_nums(info_data.db6)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB7: {{format_db_nums(info_data.db7)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB8: {{format_db_nums(info_data.db8)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB9: {{format_db_nums(info_data.db9)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB10: {{format_db_nums(info_data.db10)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB11: {{format_db_nums(info_data.db11)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB12: {{format_db_nums(info_data.db12)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB13: {{format_db_nums(info_data.db13)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB14: {{format_db_nums(info_data.db14)}}</a-card-grid>
                    <a-card-grid class="gridcard33">DB15: {{format_db_nums(info_data.db15)}}</a-card-grid>
                  </a-card>
                </a-collapse-panel>
              </a-collapse>
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
// let server = '127.0.0.1:51299'
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
      time_data: [],
      info_data: {},
      logs_data: [],
      logs_columns: [{
        title: 'ID',
        dataIndex: 'id',
      }, {
        title: '记录时间',
        dataIndex: 'time',
        scopedSlots: { customRender: 'time' },
      }, {
        title: '执行时间(微秒)',
        dataIndex: 'time_used',
      }, {
        title: '日志详情',
        dataIndex: 'msg',
      }],
      clients_data: [],
      clients_columns: [{
        title: 'ID',
        dataIndex: 'id',
      }, {
        title: '主机',
        dataIndex: 'addr',
      }, {
        title: '连接时长(秒)',
        dataIndex: 'age',
      }, {
        title: '数据库ID',
        dataIndex: 'db',
      }, {
        title: '订阅频道',
        dataIndex: 'sub',
      }, {
        title: '最近执行',
        dataIndex: 'cmd',
      }],
      websocket: null,
      myChart: null,
      myChart1: null,
      myChart2: null,
      myChart3: null,
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
      } else if (value.key === 'redis_info') {
        this.memu_key = value.key
        axios.get(this.url + '/containers?method=info&ip=' + this.redis_ip)
          .then(result => {
            this.info_data = result.data.data;
          })
        axios.get(this.url + '/containers?method=logs&ip=' + this.redis_ip)
          .then(result => {
            this.logs_data = result.data.data;
          })
        axios.get(this.url + '/containers?method=clients&ip=' + this.redis_ip)
          .then(result => {
            this.clients_data = result.data.data;
          })
      } else {
        this.redis_ip = value.key
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
    circle_push(arr, val) {
      arr.push(val)
      if (arr.length > 30 * 60 * 60) {
        arr.shift()
      }
      return arr
    },
    format_db_nums(str) {
      if (str === undefined) return 0
      if (str === "") return 0
      let s = str.split(',')[0]
      return s.split('=')[1]
    },
    formatSeconds(value) {
      var secondTime = parseInt(value);// 秒
      var minuteTime = 0;// 分
      var hourTime = 0;// 小时
      if(secondTime > 60) {//如果秒数大于60，将秒数转换成整数
        //获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseInt(secondTime / 60);
        //获取秒数，秒数取佘，得到整数秒数
        secondTime = parseInt(secondTime % 60);
        //如果分钟大于60，将分钟转换成小时
        if(minuteTime > 60) {
          //获取小时，获取分钟除以60，得到整数小时
          hourTime = parseInt(minuteTime / 60);
          //获取小时后取佘的分，获取分钟除以60取佘的分
          minuteTime = parseInt(minuteTime % 60);
        }
      }
      var result = "" + parseInt(secondTime) + "秒";

      if(minuteTime > 0) {
        result = "" + parseInt(minuteTime) + "分" + result;
      }
      if(hourTime > 0) {
        result = "" + parseInt(hourTime) + "小时" + result;
      }
      return result;
    },
    receiveData(e) {
      const redata = JSON.parse(e.data);
      const ip = redata.msg
      if (ip !== this.redis_ip) return

      const data = JSON.parse(redata.data)
      this.info_data = data

      let now = new Date().Format("HH:mm:ss")
      this.time_data = this.circle_push(this.time_data, now)

      this.option.xAxis[0].data = this.time_data
      this.option.xAxis[1].data = this.time_data
      this.option.series[0].data = this.circle_push(this.option.series[0].data, data['instantaneous_input_kbps'])
      this.option.series[1].data = this.circle_push(this.option.series[1].data, data['instantaneous_output_kbps'])
      this.myChart.setOption(this.option);

      this.option1.xAxis.data = this.time_data
      this.option1.series[0].data = this.circle_push(this.option1.series[0].data, data['used_memory'] / 1024)
      this.myChart1.setOption(this.option1);

      this.option2.xAxis.data = this.time_data
      this.option2.series[0].data = this.circle_push(this.option2.series[0].data, data['instantaneous_ops_per_sec'])
      this.myChart2.setOption(this.option2);

      this.option3.xAxis.data = this.time_data
      this.option3.series[0].data = this.circle_push(this.option3.series[0].data, data['used_cpu_user'])
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

  .gridcard {
    width: 50%;
    textAlign: 'left';
  }
  .gridcard33 {
    width: 20%;
    textAlign: 'left';
  }
</style>
