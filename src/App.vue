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
          <a-row>
            <a-col :span="16" style="padding-right: 10px">
              <a-divider>高时延日志</a-divider>
              <a-table rowKey="id" :columns="logs_columns" :loading="logs_loading" :dataSource="logs_data" :pagination="false" :scroll="{ y: 310 }" style="word-break: break-all">
                <template slot="time" slot-scope="text">
                  {{new Date(text*1000).Format("yyyy-MM-dd HH:mm:ss")}}
                </template>
              </a-table>
              <a-divider>客户端列表</a-divider>
              <a-table rowKey="id" :columns="clients_columns" :loading="clients_loading" :dataSource="clients_data" :pagination="{ pageSize: 50 }" :scroll="{ y: 268 }" >
                <template slot="time" slot-scope="text">
                  {{formatSeconds(text)}}
                </template>
              </a-table>
            </a-col>
            <a-col :span="8">
              <a-collapse accordion activeKey="1" style="font-size: 15px">
                <a-collapse-panel key="1">
                  <template slot="header"><a-icon type="home" /> 服务端信息 | {{redis_ip}}</template>
                  <a-card>
                    <a-card-grid class="gridcard">版本信息: <a-tag color="green">{{info_data.redis_version}} | {{info_data.arch_bits}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">PID | PORT: <a-tag color="green">{{info_data.process_id}} | {{info_data.tcp_port}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard">服务模式: {{info_data.redis_mode}}</a-card-grid>
                    <a-card-grid class="gridcard">运行时间: {{formatSeconds(info_data.uptime_in_seconds)}}</a-card-grid>
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
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db0)>0">DB0: <a-tag color="green">{{format_db_nums(info_data.db0)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db1)>0">DB1: <a-tag color="green">{{format_db_nums(info_data.db1)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db2)>0">DB2: <a-tag color="green">{{format_db_nums(info_data.db2)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db3)>0">DB3: <a-tag color="green">{{format_db_nums(info_data.db3)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db4)>0">DB4: <a-tag color="green">{{format_db_nums(info_data.db4)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db5)>0">DB5: <a-tag color="green">{{format_db_nums(info_data.db5)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db6)>0">DB6: <a-tag color="green">{{format_db_nums(info_data.db6)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db7)>0">DB7: <a-tag color="green">{{format_db_nums(info_data.db7)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db8)>0">DB8: <a-tag color="green">{{format_db_nums(info_data.db8)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db9)>0">DB9: <a-tag color="green">{{format_db_nums(info_data.db9)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db10)>0">DB10: <a-tag color="green">{{format_db_nums(info_data.db10)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db11)>0">DB11: <a-tag color="green">{{format_db_nums(info_data.db11)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db12)>0">DB12: <a-tag color="green">{{format_db_nums(info_data.db12)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db13)>0">DB13: <a-tag color="green">{{format_db_nums(info_data.db13)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db14)>0">DB14: <a-tag color="green">{{format_db_nums(info_data.db14)}}</a-tag></a-card-grid>
                    <a-card-grid class="gridcard25" v-if="format_db_nums(info_data.db15)>0">DB15: <a-tag color="green">{{format_db_nums(info_data.db15)}}</a-tag></a-card-grid>
                  </a-card>
                </a-collapse-panel>
              </a-collapse>
            </a-col>
          </a-row>
        </div>
        <div v-show="memu_key=='redis_pubsub'">
          <a-row style="padding-top: 10px">
            <a-col :span="16" style="padding-right: 10px">
              <div class="redis-output-container">
                <a-list bordered :dataSource="redis_output[redis_ip]" >
                  <div slot="header">Redis输出信息:</div>
<!--                  <a-tag color="#108ee9" v-else :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">-->
<!--                    {{tag}}-->
<!--                  </a-tag>&nbsp;&nbsp;-->
                  <a-list-item slot="renderItem" slot-scope="item, index">{{item}}
                    <div slot="actions">
                      <a-tag color="blue" @click="format_json(item)">JSON</a-tag>
                      <a-tag color="red" @click="delete_pubsub_output(index)">X</a-tag>
                    </div>
                  </a-list-item>
                </a-list>
              </div>
            </a-col>
            <a-col :span="8" style="padding-top: 8px">
              <a-input-group compact>
                <a-input v-model="pubsub_key" style="width: 38%" placeholder="发布/订阅的Channel" />
                <a-input v-model="pubsub_msg" style="width: 38%" placeholder="发布的信息" />
                <a-button type="primary" @click="publish_msg" style="background: #108ee9; border-color: #108ee9">发布</a-button>
                <a-button type="primary" @click="subscribe_msg" style="background: #87d068; border-color: #87d068">订阅</a-button>
              </a-input-group>
              <a-divider>发布列表</a-divider>
              <div style="line-height: 2">
                <template v-for="tag in publish_keys[redis_ip]">
                  <a-tooltip v-if="tag.length > 50" :key="tag" :title="tag">
                    <a-tag color="#108ee9" :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">
                      {{`${tag.slice(0, 50)}...`}}
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
                  <a-tooltip v-if="tag.length > 50" :key="tag" :title="tag">
                    <a-tag color="#87d068" :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
                      {{`${tag.slice(0, 50)}...`}}
                    </a-tag>
                  </a-tooltip>
                  <a-tag color="#87d068" v-else :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
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

import axios from "axios";
import echarts from 'echarts'
import jsonView from 'vue-json-views'

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
  components: {
    jsonView
  },
  data() {
    return {
      // eslint-disable-next-line no-console
      log: console.log,
      url: base_url,
      ws_url: ws_url,
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
      subscribe_keys_flag: {},
      publish_keys: {},
      pubsub_key: '',
      pubsub_msg: '',
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
      logs_columns: [{
        title: 'ID',
        dataIndex: 'id',
        width: 100,
      }, {
        title: '记录时间',
        dataIndex: 'time',
        width: 200,
        scopedSlots: { customRender: 'time' },
      }, {
        title: '执行时间(微秒)',
        dataIndex: 'time_used',
        width: 150,
      }, {
        title: '日志详情',
        dataIndex: 'msg',
      }],
      clients_loading: false,
      clients_data: [],
      clients_columns: [{
        title: 'ID',
        dataIndex: 'id',
        width: 150,
      }, {
        title: '主机',
        dataIndex: 'addr',
        width: 200,
      }, {
        title: '连接时长',
        dataIndex: 'age',
        scopedSlots: { customRender: 'time' },
        width: 150,
      }, {
        title: '数据库ID',
        dataIndex: 'db',
        width: 150,
      }, {
        title: '订阅频道',
        dataIndex: 'sub',
        width: 150,
      }, {
        title: '最近执行',
        dataIndex: 'cmd',
        width: 150,
      }],
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
    send_websocket_msg(json_data={'type':0}) {
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
    format_json(data) {
      let json_data = data.split('接收')[1]
      try {
        if (typeof JSON.parse(json_data) == "object") {
          this.jsonData = JSON.parse(json_data)
          this.showJson = true
        } else {
          this.$message.error('不支持该类型数据转化为JSON')
        }
      } catch(e) {
        this.$message.error('不支持该类型数据转化为JSON')
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
      axios.get(this.url + `/containers?method=publish&ip=${this.redis_ip}&key=${this.pubsub_key}&msg=${this.pubsub_msg}`)
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
            this.redis_command_output += `${new Date().Format("yyyy-MM-dd HH:mm:ss")}\t${output}\n`
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
    process_info_data(redata) {
      const ip = redata.msg
      const data = JSON.parse(redata.data)
      this.info_data_map[ip] = data
      this.info_data = this.info_data_map[this.redis_ip]
      this.time_data[ip] = this.circle_push(this.time_data[ip], new Date().Format("HH:mm:ss"))
      this.info_input_kbps[ip] = this.circle_push(this.info_input_kbps[ip], data['instantaneous_input_kbps'])
      this.info_output_kbps[ip] = this.circle_push(this.info_output_kbps[ip], data['instantaneous_output_kbps'])
      this.info_used_memory[ip] = this.circle_push(this.info_used_memory[ip], data['used_memory'] / 1024)
      this.info_ops_per_sec[ip] = this.circle_push(this.info_ops_per_sec[ip], data['instantaneous_ops_per_sec'])
      this.info_used_cpu_user[ip] = this.circle_push(this.info_used_cpu_user[ip], data['used_cpu_user'])
      this.updateCharts()
    },
    receiveData(e) {
      const redata = JSON.parse(e.data);
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
          return
        } else if (redata.status == -1) {
          this.$message.success(`${redata.msg} 取消订阅成功`)
          const tags = this.subscribe_keys[redata.msg].filter(tag => tag !== redata.data)
          this.subscribe_keys[this.redis_ip] = tags
          this.$forceUpdate()
          return
        }
        this.redis_output[this.redis_ip] = this.circle_push(this.redis_output[this.redis_ip], `从 ${redata.msg} 接收 ${redata.data} \n`)
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
  },
  mounted() {
    this.myChart = echarts.init(this.$refs.chart)
    this.myChart1 = echarts.init(this.$refs.chart1)
    this.myChart2 = echarts.init(this.$refs.chart2)
    this.myChart3 = echarts.init(this.$refs.chart3)
    this.updateCharts()
  },
  beforeDestroy() {
    if (this.websocket_ping !== null) {
      clearTimeout(this.websocket_ping);
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
