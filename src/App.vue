<template>
  <div id="app">
    <a-layout id="components-layout-demo-top" class="layout">
      <a-layout-header>
        <div class="logo" />
        <a-row>
          <a-col :span="17">
            <a-menu
                    theme="dark"
                    mode="horizontal"
                    @click="menuClick"
                    :defaultSelectedKeys="['redis_info']"
                    :style="{ lineHeight: '64px' }"
            >
              <a-menu-item key="redis_info"><a-icon type="info-circle" />系统详情</a-menu-item>
              <a-menu-item key="redis_monitor"><a-icon type="dashboard" />性能监控</a-menu-item>
<!--              <a-menu-item key="2"><a-icon type="database" />数据信息</a-menu-item>-->
              <a-menu-item key="redis_pubsub"><a-icon type="swap" />发布订阅</a-menu-item>
            </a-menu>
          </a-col>
          <a-col :span="5">
            <a-row type="flex" justify="end">
              <a-col :span="10">
                <a-select :value="redis_ip" style="width: 150px" @change="change_redis">
                  <a-select-option v-for="item in containers" :value="item.ip" v-bind:key="item.ip">{{item.name}}</a-select-option>
                </a-select>
              </a-col>
              <a-col :span="2" :offset="1">
                <a-dropdown>
                  <a-icon class="ant-dropdown-link" type="setting" style="color: #ffffff; font-size: 28px; padding-top: 17px"/>
                  <a-menu slot="overlay" @click="settingClick">
                    <a-menu-item key="about"><a-icon type="info-circle"/>关于程序</a-menu-item>
<!--                    <a-menu-item key="update"><a-icon type="info-circle"/>-->
<!--                      <a-badge v-if="updateFlag" status="error">更新通知</a-badge>-->
<!--                      <span v-else>更新通知</span>-->
<!--                    </a-menu-item>-->
                    <a-menu-item key="edit"><a-icon type="edit"/>连接管理</a-menu-item>
                  </a-menu>
                </a-dropdown>
              </a-col>
            </a-row>
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content style="padding: 0 50px; height: 92vh">
        <div v-show="memu_key=='redis_monitor'">
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
          <RedisInfo :redis_ip="redis_ip" :info_data="info_data"
                     :clients_loading="clients_loading" :clients_data="clients_data"
                     :logs_loading="logs_loading" :logs_data="logs_data">
          </RedisInfo>
        </div>
        <div v-show="memu_key=='redis_pubsub'">
          <a-row style="padding-top: 10px">
            <a-col :span="16" style="padding-right: 10px">
              <div class="redis-output-container">
                <a-list bordered :dataSource="redis_output[redis_ip]" >
                  <div slot="header">Redis输出信息:</div>
                  <a-list-item slot="renderItem" slot-scope="item, index">
                    <a-list-item-meta :description="item[1]" >
                      <a slot="title">接收通道: {{item[0]}}</a>
                    </a-list-item-meta>
                    <div slot="actions">
                      <a-tag color="blue" @click="format_json(item[1])">JSON</a-tag>
                      <a-tag color="red" @click="delete_pubsub_output(index)">X</a-tag>
                    </div>
                  </a-list-item>
                </a-list>
              </div>
            </a-col>
            <a-col :span="8" style="padding-top: 8px">
              <a-input v-model="pubsub_key" style="margin-bottom: 8px" placeholder="发布/订阅的Channel" />
              <a-textarea v-model="pubsub_msg" :rows="10" style="margin-bottom: 8px" :placeholder="pubsub_msg_placeholder" />
              <a-button type="primary" @click="publish_msg" style="background: #108ee9; border-color: #108ee9">发布</a-button>
              <a-button type="primary" @click="subscribe_msg" style="background: #87d068; border-color: #87d068; margin-left: 5px">订阅</a-button>

              <a-divider>发布列表</a-divider>
              <div style="line-height: 2">
                <template v-for="tag in publish_keys[redis_ip]">
                  <a-tooltip v-if="tag.length > 100" :key="tag" :title="tag">
                    <a-tag color="#108ee9" :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">
                      {{`${tag.slice(0, 100)}...`}}
                    </a-tag>
                  </a-tooltip>
                  <a-tag color="#108ee9" v-else :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">
                    {{tag}}
                  </a-tag>&nbsp;&nbsp;
                </template>
              </div>
              <a-divider>订阅列表</a-divider>
              <div style="line-height: 2">
                <template v-for="tag in subscribe_keys[redis_ip]">
                  <a-tooltip v-if="tag.length > 100" :key="tag" :title="tag">
                    <a-tag color="#87d068" :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
                      {{`${tag.slice(0, 100)}...`}}
                    </a-tag>
                  </a-tooltip>
                  <a-tag color="#87d068" v-else :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
                    {{tag}}
                  </a-tag>
                </template>
                <template v-for="tag in subscribe_keys_history[redis_ip]">
                  <a-tooltip v-if="tag.length > 50" :key="tag" :title="tag">
                    <a-tag color="darkgrey" :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagHisClose(tag)">
                      {{`${tag.slice(0, 50)}...`}}
                    </a-tag>
                  </a-tooltip>
                  <a-tag color="darkgrey" v-else :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagHisClose(tag)">
                    {{tag}}
                  </a-tag>
                </template>
              </div>
            </a-col>
          </a-row>
        </div>
<!--        <a-select :value="redis_db" @change="(value)=>{redis_db=value}" style="width: 120px">-->
<!--          <a-select-option v-for="item in dbs" :value="item.value" v-bind:key="item.value">{{item.label}}</a-select-option>-->
<!--        </a-select>-->

      </a-layout-content>
    </a-layout>
    <a-button shape="circle" icon="thunderbolt" size="large" @click="()=>{command_visible = true}" class="command-botton"/>
    <a-drawer
            width=560
            placement="right"
            @close="()=>{visible = false}"
            :visible="visible"
    >
      <div slot="title" >Redis连接管理 <a-divider type="vertical" /> <a-button icon="plus" style="color: #42b983" @click="add_container">添加连接</a-button></div>
      <a-card>
        <a-card-grid class="gridcard100" v-for="(item, key) in containers" v-bind:key="key">
          名称: <a-tag color="green">{{item.name}}</a-tag> <a-divider type="vertical" />
          IP: <a-tag color="blue">{{item.ip}}</a-tag> <a-divider type="vertical" />
          端口: {{item.port}} <a-divider type="vertical" />
          DB: {{item.db}} <br/><br/>
          密码: {{item.password}} <a-divider type="vertical" />
          <a-button shape="circle" icon="edit" @click="edit_container(item)"/>
          <a-button shape="circle" icon="delete" type="danger" @click="delete_container(item.ip)"/>
        </a-card-grid>
      </a-card>
    </a-drawer>
    <a-drawer
            :title="children_drawl_name"
            width=280
            @close="()=>{visible_children = false}"
            :visible="visible_children"
    >
      <a-input placeholder="连接IP" v-if="children_drawl_name=='修改连接'" size="large" v-model="container_tmp.ip" disabled>
        <a-icon slot="prefix" type="api" />
        <a-icon v-if="container_tmp.ip" slot="suffix" type="close-circle" @click="()=>{container_tmp.ip = ''}" />
      </a-input>
      <a-input placeholder="连接IP" v-else size="large" v-model="container_tmp.ip" @change="()=>{container_tmp.name = container_tmp.ip}">
        <a-icon slot="prefix" type="api" />
        <a-icon v-if="container_tmp.ip" slot="suffix" type="close-circle" @click="()=>{container_tmp.ip = ''}" />
      </a-input>
      <a-input placeholder="连接名称" size="large" v-model="container_tmp.name" style="margin-top: 10px">
        <a-icon slot="prefix" type="user" />
        <a-icon v-if="container_tmp.name" slot="suffix" type="close-circle" @click="()=>{container_tmp.name = ''}" />
      </a-input>
      <a-input placeholder="密码" size="large" v-model="container_tmp.password" style="margin-top: 10px">
        <a-icon slot="prefix" type="warning" />
        <a-icon v-if="container_tmp.password" slot="suffix" type="close-circle" @click="()=>{container_tmp.password = ''}" />
      </a-input>
      <a-input placeholder="端口" size="large" v-model="container_tmp.port" style="margin-top: 10px">
        <a-icon slot="prefix" type="appstore" />
        <a-icon v-if="container_tmp.port" slot="suffix" type="close-circle" @click="()=>{container_tmp.port = ''}" />
      </a-input>
      <a-input placeholder="DB" size="large" v-model="container_tmp.db" style="margin-top: 10px">
        <a-icon slot="prefix" type="hdd" />
        <a-icon v-if="container_tmp.db" slot="suffix" type="close-circle" @click="()=>{container_tmp.db = ''}" />
      </a-input>
      <a-button type="primary" style="margin-top: 10px" v-if="children_drawl_name=='修改连接'" @click="upload_edit" :loading="visible_children_loading">确认</a-button>
      <a-button type="primary" style="margin-top: 10px" v-else @click="upload_add" :loading="visible_children_loading">确认</a-button>
    </a-drawer>
    <a-drawer
            height=500
            placement="bottom"
            @close="()=>{command_visible = false}"
            :visible="command_visible"
    >
      <div slot="title" >Redis终端 (请不要执行带阻塞性质的命令 例如: BLPOP, SUBSCRIBE)</div>
      <a-textarea id="redis_command_output" v-model="redis_command_output" placeholder="Redis命令输出" :rows="16" style="background: silver;word-break: break-all;"/>
      <a-input-search v-model="redis_command" placeholder="请输入执行的命令" style="margin-top: 10px" @search="execute_command">
        <a-button slot="enterButton" type="primary">执行</a-button>
      </a-input-search>
    </a-drawer>

    <a-modal v-model="showJson" :footer="null" :destroyOnClose="true" width="50vw" @ok="()=>{}">
      <json-view :data="jsonData" style="margin-top: 20px; overflow: auto; max-height: 72vh"/>
    </a-modal>
  </div>
</template>

<script>

import axios from "axios"
import echarts from 'echarts'
import moment from 'moment'
import jsonView from 'vue-json-views'
import RedisInfo from "./components/RedisInfo"
import config from './config'

export default {
  name: "app",
  components: {
    jsonView, RedisInfo
  },
  data() {
    return {
      // eslint-disable-next-line no-console
      log: console.log,
      moment: moment,
      url: config.base_url,
      ws_url: config.ws_url,
      redis_name: "",
      redis_ip: "",
      redis_db: 0,
      containers: {},
      container_tmp: {ip:'', name:'', password:'', port:6379, db:0, status:0},
      dbs: [],
      visible: false,
      visible_children: false,
      visible_children_loading: false,
      children_drawl_name: '新增连接',
      memu_key: '',
      subscribe_keys: {},
      subscribe_keys_history: {},
      subscribe_keys_flag: {},
      publish_keys: {},
      pubsub_key: '',
      pubsub_msg: '',
      pubsub_msg_placeholder: '需要发布的信息, 可以直接放上可读的Json, 例如:\n{\n  "ABC": [\n    "123456",\n    "234567",\n    "345678",\n  ],\n  "DEF": ["567890"]\n}',
      redis_output: {},
      redis_command: '',
      redis_command_output: '',
      command_visible: false,
      updateFlag: false,
      time_data: {},
      info_data: {},
      info_data_map: {},
      info_data_flags: {},

      logs_loading: false,
      logs_data: [],
      clients_loading: false,
      clients_data: [],

      websocket: null,
      websocket_ping: null,
      info_input_kbps: {},
      info_output_kbps: {},
      info_used_memory: {},
      info_ops_per_sec: {},
      info_used_cpu_user: {},
      jsonData: "",
      showJson: false,
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
      this.memu_key = value.key
      if (this.memu_key === 'redis_info') {
        this.get_redis_infos()
      } else if (this.memu_key === 'redis_monitor') {
        this.websocket_get_redis_info()
      } else if (this.memu_key === 'redis_pubsub') {
        // todo
      } else {
        // this.$message.warning('暂未实现, 请耐心等待')
      }
    },
    settingClick(value) {
      if (value.key === 'about') {
        const h = this.$createElement
        this.$success({
          title: 'RedisGo Web V1.1.1',
          width: 420,
          content: h('div', {
            style: {
              'text-align': 'center',
              'padding-right': '35px'
            },
          }, [
            h('img', {style: {width: '50%'}, attrs: {src: "http://qiniu.zoranjojo.top/zoranjojo.jpg"}}),
            h('p', '为更好的监控/管理内网的Redis而倾心打造'),
            h('p', '可以关注公众号咨询问题或者获得最新的消息'),
          ]),
        })
      } else if (value.key === 'update') {
        this.visible = true
      } else if (value.key === 'edit') {
        this.visible = true
      }
    },
    reconnect_websocket() {
      let websocket = new WebSocket(this.ws_url)
      websocket.onopen = () => {
        this.log("WebSocket连接成功")
        // 60秒一次的心跳信号, 防止websocket自动断开
        this.websocket_ping = setInterval(this.send_websocket_msg, 60000)
      }
      websocket.onerror = () => this.$message.error('WebSocket连接发生错误, 请刷新页面')
      websocket.onclose = (e) => {
        this.log(`WebSocket连接关闭 (${e.data})`)
        this.websocket = null
        clearTimeout(this.websocket_ping)
        this.websocket_ping = null
      }
      websocket.onmessage = (e) => this.receiveData(e)
      this.websocket = websocket
    },
    send_websocket_msg(json_data={'type':0}) {  // type为0的时候是发心跳信号
      this.websocket.send(JSON.stringify(json_data));
    },
    websocket_get_redis_info() {
      if (this.info_data_flags[this.redis_ip] === undefined) {
        this.send_websocket_msg({
          'type': 1, 'ip': this.redis_ip
        })
        this.info_data_flags[this.redis_ip] = true
      }
    },
    change_redis(val) {
      this.redis_ip = val
      if (this.memu_key === 'redis_monitor') {
        this.websocket_get_redis_info()
      } else if (this.memu_key === 'redis_info') {
        this.get_redis_infos()
      }
    },
    get_redis_infos() {
      this.get_info()
      this.get_logs()
      this.get_clients()
    },
    get_info() {
      axios.get(this.url + '/containers?method=info&ip=' + this.redis_ip)
        .then(result => {
          this.info_data_map[this.redis_ip] = result.data.data
          this.info_data = result.data.data
        })
    },
    get_logs() {
      this.logs_loading = true
      axios.get(this.url + '/containers?method=logs&ip=' + this.redis_ip)
        .then(result => {
          this.logs_data = result.data.data;
          this.logs_loading = false
        })
    },
    get_clients() {
      this.clients_loading = true
      axios.get(this.url + '/containers?method=clients&ip=' + this.redis_ip)
        .then(result => {
          this.clients_data = result.data.data;
          this.clients_loading = false
        })
    },

    format_json(json_data) {
      // let json_data = data.split(' | ')[1]
      try {
        if (typeof JSON.parse(json_data) == "object") {
          this.jsonData = JSON.parse(json_data)
          this.showJson = true
        } else {
          this.$message.error('不支持该类型数据的JSON展示')
        }
      } catch(e) {
        this.$message.error('不支持该类型数据的JSON展示')
      }
    },
    delete_pubsub_output(index) {
      this.redis_output[this.redis_ip].splice(index, 1)
      this.$forceUpdate()
    },
    publish_msg() {
      if (this.redis_ip == "") {
        this.$message.error('未检测到有效的Redis连接, 请在设置中添加', 10)
        return
      }
      if (this.pubsub_key == "") {
        this.$message.error('请输入Channel再试')
        return
      }
      axios.get(this.url + `/containers?method=publish&ip=${this.redis_ip}&key=${encodeURIComponent(this.pubsub_key)}&msg=${encodeURIComponent(this.pubsub_msg)}`)
        .then(result => {
          let res = result.data
          if (res.code != 0) {
            this.$message.error(res.msg)
          } else {
            this.$message.success('Publish成功')
            if (this.publish_keys[this.redis_ip] === undefined) {
              this.publish_keys[this.redis_ip] = []
            }
            if (this.publish_keys[this.redis_ip].indexOf(res.msg + ' | ' + res.data) === -1) {
              this.publish_keys[this.redis_ip].push(res.msg + ' | ' + res.data)
              localStorage.setItem('publish_keys', JSON.stringify(this.publish_keys))
              this.$forceUpdate()
            }
          }
        })
    },
    subscribe_msg() {
      if (this.redis_ip == "") {
        this.$message.error('未检测到有效的Redis连接, 请在设置中添加并刷新页面', 10)
        return
      }
      if (this.pubsub_key == "") {
        this.$message.error('请输入Channel再试')
        return
      }
      if (this.subscribe_keys_flag[this.redis_ip] === undefined) {
        this.subscribe_keys_flag[this.redis_ip] = {}
      }
      if (this.subscribe_keys_flag[this.redis_ip][this.pubsub_key] === undefined) {
        this.send_websocket_msg({
          'type': 2, 'ip': this.redis_ip, 'channel': this.pubsub_key, 'command': 'open'
        })
        this.subscribe_keys_flag[this.redis_ip][this.pubsub_key] = true
      } else {
        this.$message.error(`已经订阅 ${this.pubsub_key}, 无需重复订阅`)
      }
    },
    upload_add() {
      this.visible_children_loading = true
      axios.get(this.url + `/containers?method=add&ip=${this.container_tmp.ip}&name=${this.container_tmp.name}&password=${this.container_tmp.password}&port=${this.container_tmp.port}&db=${this.container_tmp.db}`)
        .then(result => {
          this.visible_children_loading = false
          let res = result.data
          if (res.code != 0) {
            this.$message.error(res.msg)
          } else {
            this.containers[this.container_tmp.ip] = res.data
            this.$message.success('添加成功')
            this.visible_children = false
            if (Object.keys(this.containers).length === 1) {
              this.redis_ip = this.container_tmp.ip
              this.redis_name = this.container_tmp.name
              this.menuClick({key:'redis_info'})
            }
          }
        })
    },
    upload_edit() {
      this.visible_children_loading = true
      axios.get(this.url + `/containers?method=edit&ip=${this.container_tmp.ip}&name=${this.container_tmp.name}&password=${this.container_tmp.password}&port=${this.container_tmp.port}&db=${this.container_tmp.db}`)
        .then(result => {
          this.visible_children_loading = false
          let res = result.data
          if (res.code != 0) {
            this.$message.error(res.msg)
          } else {
            this.containers[this.container_tmp.ip] = res.data
            this.$message.success('修改成功')
            this.visible_children = false
          }
        })
    },
    add_container() {
      this.visible_children = true
      this.children_drawl_name = '新增连接'
      this.container_tmp.ip = ''
      this.container_tmp.password = ''
      this.container_tmp.name = ''
      this.container_tmp.port = 6379
      this.container_tmp.db = 0
    },
    edit_container(item) {
      this.visible_children = true
      this.children_drawl_name = '修改连接'
      this.container_tmp.ip = item.ip
      this.container_tmp.password = item.password
      this.container_tmp.name = item.name
      this.container_tmp.port = item.port
      this.container_tmp.db = item.db
    },
    delete_container(ip) {
      axios.get(this.url + '/containers?method=delete&ip=' + ip)
        .then(result => {
          let code = result.data.code;
          if (code == 0) {
            this.$message.success('成功删除Redis连接');
            if (ip === this.redis_ip) {
              let find = false
              for (let c in this.containers) {
                if (this.containers[c].ip !== ip) {
                  this.redis_ip = this.containers[c].ip
                  find = true
                  break
                }
              }
              if (!find) {
                this.$message.error('未检测到有效的Redis连接, 请在右上角的设置中添加', 10);
              }
            }
            delete this.containers[ip]
            this.$forceUpdate()
          }
        })
    },
    execute_command() {
      axios.get(this.url + `/containers?method=execute&ip=${this.redis_ip}&command=${this.redis_command}`)
        .then(result => {
          let code = result.data.code;
          if (code == 0) {
            let output = result.data.data
            if (Array.isArray(output)) {
              output = output.join(', ')
            }
            this.redis_command_output += `${moment().format('YYYY-MM-DD HH:mm:ss')}\t${output}\n`
            const textarea = document.getElementById('redis_command_output');
            textarea.scrollTop = textarea.scrollHeight;
          }
        })
    },
    circle_push(arr, val, len = 10 * 60 * 60) {
      if (arr === undefined) {
        arr = []
      }
      arr.push(val)
      // 保留10分钟的数据
      if (arr.length > len) {
        arr.shift()
      }
      return arr
    },


    process_info_data(redata) {
      const ip = redata.msg
      const data = JSON.parse(redata.data)
      this.info_data_map[ip] = data
      this.info_data = this.info_data_map[this.redis_ip]
      this.time_data[ip] = this.circle_push(this.time_data[ip], moment().format('HH:mm:ss'))
      this.info_input_kbps[ip] = this.circle_push(this.info_input_kbps[ip], data['instantaneous_input_kbps'])
      this.info_output_kbps[ip] = this.circle_push(this.info_output_kbps[ip], data['instantaneous_output_kbps'])
      this.info_used_memory[ip] = this.circle_push(this.info_used_memory[ip], data['used_memory'] / 1024)
      this.info_ops_per_sec[ip] = this.circle_push(this.info_ops_per_sec[ip], data['instantaneous_ops_per_sec'])
      this.info_used_cpu_user[ip] = this.circle_push(this.info_used_cpu_user[ip], data['used_cpu_user'])
      this.updateCharts()
    },
    receiveData(e) {
      const redata = JSON.parse(e.data);
      if (redata.type == 0) return
      if (redata.type == 1) {
        this.process_info_data(redata)
      } else if (redata.type == 2) {
        if (redata.status == 0) {
          this.$message.success(`${redata.msg} 订阅成功`)
          if (this.subscribe_keys[this.redis_ip] === undefined) {
            this.subscribe_keys[this.redis_ip] = []
          }
          if (this.subscribe_keys[this.redis_ip].indexOf(this.pubsub_key) === -1) {
            this.subscribe_keys[this.redis_ip].push(this.pubsub_key)
            this.$forceUpdate()
          }
          this.handleTagHisClose(redata.msg)
          return
        } else if (redata.status == -1) {
          this.$message.success(`${redata.msg} 取消订阅成功`)
          const tags = this.subscribe_keys[redata.msg].filter(tag => tag !== redata.data)
          this.subscribe_keys[this.redis_ip] = tags
          this.$forceUpdate()
          return
        }
        this.redis_output[this.redis_ip] = this.circle_push(this.redis_output[this.redis_ip], [redata.msg, redata.data])
        this.$forceUpdate()
      }
    },
    copyPublishMsg(val) {
      let key_val = val.split(' | ')
      this.pubsub_key = key_val[0]
      this.pubsub_msg = key_val[1]
    },
    handlePubClose(removedTag) {
      const tags = this.publish_keys[this.redis_ip].filter(tag => tag !== removedTag)
      this.publish_keys[this.redis_ip] = tags
      this.$forceUpdate()
    },
    handleTagClose(removedTag) {
      if (this.subscribe_keys_flag[this.redis_ip]) {
        this.send_websocket_msg({
          'type': 2, 'ip': this.redis_ip, 'channel': removedTag, 'command': 'close'
        })
        delete this.subscribe_keys_flag[this.redis_ip]
      }
    },
    handleTagHisClose(removedTag) {
      const tags = this.subscribe_keys_history[this.redis_ip].filter(tag => tag !== removedTag)
      this.subscribe_keys_history[this.redis_ip] = tags
      this.$forceUpdate()
    },
    updateCharts() {
      this.option.xAxis[0].data = this.time_data[this.redis_ip]
      this.option.xAxis[1].data = this.time_data[this.redis_ip]
      this.option.series[0].data = this.info_input_kbps[this.redis_ip]
      this.option.series[1].data = this.info_output_kbps[this.redis_ip]
      this.myChart.setOption(this.option);

      this.option1.xAxis.data = this.time_data[this.redis_ip]
      this.option1.series[0].data = this.info_used_memory[this.redis_ip]
      this.myChart1.setOption(this.option1);

      this.option2.xAxis.data = this.time_data[this.redis_ip]
      this.option2.series[0].data = this.info_ops_per_sec[this.redis_ip]
      this.myChart2.setOption(this.option2);

      this.option3.xAxis.data = this.time_data[this.redis_ip]
      this.option3.series[0].data = this.info_used_cpu_user[this.redis_ip]
      this.myChart3.setOption(this.option3);
    },
    onDestroy() {
      if (this.websocket_ping !== null) {
        clearTimeout(this.websocket_ping);
      }
      let save_subscribe_keys = this.subscribe_keys
      for (let ip in this.subscribe_keys_history) {
        for (let index in this.subscribe_keys_history[ip]) {
          let channel = this.subscribe_keys_history[ip][index]
          if (save_subscribe_keys[ip] === undefined) {
            save_subscribe_keys[ip] = []
            save_subscribe_keys[ip].push(channel)
          }
          if (save_subscribe_keys[ip].indexOf(channel) === -1) {
            save_subscribe_keys[ip].push(channel)
          }
        }
      }
      localStorage.setItem('subscribe_keys', JSON.stringify(save_subscribe_keys))
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
          this.redis_ip = data[c]["ip"];
          this.redis_name = data[c]["name"];
        }
      }
      if (this.redis_ip === "") {
        this.$message.error('未检测到有效的Redis连接, 请在右上角的设置中添加', 10);
      } else {
        this.containers = data
        this.menuClick({key:'redis_info'})
      }
    });
    this.reconnect_websocket()
    window.onbeforeunload = this.onDestroy
  },
  mounted() {
    this.myChart = echarts.init(this.$refs.chart)
    this.myChart1 = echarts.init(this.$refs.chart1)
    this.myChart2 = echarts.init(this.$refs.chart2)
    this.myChart3 = echarts.init(this.$refs.chart3)
    this.updateCharts()

    let publish_keys = localStorage.getItem('publish_keys')
    if (publish_keys !== null) {
      this.publish_keys = JSON.parse(publish_keys)
    }

    let subscribe_keys = localStorage.getItem('subscribe_keys')
    if (subscribe_keys !== null) {
      this.subscribe_keys_history = JSON.parse(subscribe_keys)
    }
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
  .ant-table-header::-webkit-scrollbar {
    background-color: transparent;
  }
  .command-botton {
    position: absolute;
    right: 30px;
    bottom: 30px;
    background: darkgray
  }
  .command-botton:hover, .command-botton:focus {
    border-color: #fff;
  }
  .gridcard {
    width: 50%;
    textAlign: 'left';
  }
  .gridcard25 {
    width: 25%;
    textAlign: 'left';
  }
  .gridcard100 {
    width: 100%;
    textAlign: 'left';
  }

  .redis-output-container {
    overflow: auto;
    padding: 8px 24px;
    height: 92vh;
  }
</style>
