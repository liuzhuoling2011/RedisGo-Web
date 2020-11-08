<template>
  <div>
    <a-row>
      <a-col :span="16" style="padding-right: 10px">
        <a-divider>高时延日志</a-divider>
        <a-table rowKey="id" :columns="logs_columns" :loading="logs_loading" :dataSource="logs_data" :pagination="false" :scroll="{ y: 280 }" style="word-break: break-all">
          <template slot="time" slot-scope="text">
            {{moment(text*1000).format('YYYY-MM-DD HH:mm:ss')}}
          </template>
        </a-table>
        <a-divider>客户端列表</a-divider>
        <a-table rowKey="id" :columns="clients_columns" :loading="clients_loading" :dataSource="clients_data" :pagination="{ pageSize: 50 }" :scroll="{ y: 258 }" >
          <template slot="time" slot-scope="text">
            {{formatSeconds(text)}}
          </template>
        </a-table>
      </a-col>
      <a-col :span="8">
        <a-collapse accordion activeKey="1" style="font-size: 15px">
          <a-collapse-panel key="1">
            <template slot="header"><a-icon type="home" /> 服务端信息 | {{redis_id}}</template>
            <a-card>
              <a-card-grid class="gridcard">版本信息: <a-tag color="green">{{info_data.redis_version}} | {{info_data.arch_bits}}</a-tag></a-card-grid>
              <a-card-grid class="gridcard">PID | PORT: <a-tag color="green">{{info_data.process_id}} | {{info_data.tcp_port}}</a-tag></a-card-grid>
              <a-card-grid class="gridcard">服务模式: {{info_data.redis_mode}}</a-card-grid>
              <a-card-grid class="gridcard">运行时间:
                <a-tooltip :key="formatSeconds(info_data.uptime_in_seconds)" :title="formatSeconds(info_data.uptime_in_seconds)">
                  {{formatSeconds(info_data.uptime_in_seconds).length > 10 ? `${formatSeconds(info_data.uptime_in_seconds).slice(0, 10)}...` : formatSeconds(info_data.uptime_in_seconds)}}
                </a-tooltip>
              </a-card-grid>
              <a-card-grid class="gridcard">执行文件:
                <a-tooltip :key="info_data.executable" :title="info_data.executable">
                  {{info_data.executable.length > 15 ? `${info_data.executable.slice(0, 15)}...` : info_data.executable}}
                </a-tooltip>
              </a-card-grid>
              <a-card-grid class="gridcard">配置文件:
                <a-tooltip :key="info_data.config_file" :title="info_data.config_file">
                  {{info_data.config_file.length > 15 ? `${info_data.config_file.slice(0, 15)}...` : info_data.config_file}}
                  <a-icon @click="get_config" type="info-circle" style="font-size: 16px; color: cornflowerblue"/>
                </a-tooltip>
              </a-card-grid>
              <a-card-grid class="gridcard">系统版本:
                <a-tooltip :key="info_data.os" :title="info_data.os">
                  {{info_data.os.length > 15 ? `${info_data.os.slice(0, 15)}...` : info_data.os}}
                </a-tooltip>
              </a-card-grid>
            </a-card>
          </a-collapse-panel>
          <a-collapse-panel key="2">
            <template slot="header"><a-icon type="user" /> 客户端信息</template>
            <a-card>
              <a-card-grid class="gridcard">已连接客户端数量: <a-tag color="green">{{info_data.connected_clients}}</a-tag></a-card-grid>
              <a-card-grid class="gridcard">阻塞客户端数量: <a-tag color="orange">{{info_data.blocked_clients}}</a-tag></a-card-grid>
            </a-card>
          </a-collapse-panel>
          <a-collapse-panel key="3">
            <template slot="header"><a-icon type="bar-chart" /> 统计信息</template>
            <a-card>
              <a-card-grid class="gridcard">已接受连接数量: {{info_data.total_connections_received}}</a-card-grid>
              <a-card-grid class="gridcard">已执行命令数量: {{info_data.total_commands_processed}}</a-card-grid>
              <a-card-grid class="gridcard">总流入数据量: {{info_data.total_net_input_bytes}}</a-card-grid>
              <a-card-grid class="gridcard">总流出数据量: {{info_data.total_net_output_bytes}}</a-card-grid>
              <a-card-grid class="gridcard">每秒流入数据量: {{info_data.instantaneous_input_kbps}}</a-card-grid>
              <a-card-grid class="gridcard">每秒流出数据量: {{info_data.instantaneous_output_kbps}}</a-card-grid>
              <a-card-grid class="gridcard">每秒执行命令数量: {{info_data.instantaneous_ops_per_sec}}</a-card-grid>
              <a-card-grid class="gridcard">过期删除键: {{info_data.expired_keys}}</a-card-grid>
              <a-card-grid class="gridcard">驱逐(evict)键数量: {{info_data.evicted_keys}}</a-card-grid>
              <a-card-grid class="gridcard">查找键成功次数: {{info_data.keyspace_hits}}</a-card-grid>
              <a-card-grid class="gridcard">订阅频道数量: {{info_data.pubsub_channels}}</a-card-grid>
              <a-card-grid class="gridcard">订阅模式数量: {{info_data.pubsub_patterns}}</a-card-grid>
              <a-card-grid class="gridcard">拒绝连接请求数量: {{info_data.rejected_connections}}</a-card-grid>
            </a-card>
          </a-collapse-panel>
          <a-collapse-panel key="4">
            <template slot="header"><a-icon type="hdd" /> 持久信息</template>
            <a-card>
              <a-card-grid class="gridcard">AOF是否打开: {{info_data.aof_enabled}}</a-card-grid>
              <a-card-grid class="gridcard">AOF文件大小: {{info_data.aof_current_size}}</a-card-grid>
              <a-card-grid class="gridcard">RDB文件保存时间: <br> {{moment(info_data.rdb_last_save_time*1000).format('YYYY-MM-DD HH:mm:ss')}}</a-card-grid>
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
    <a-drawer
      width=560
      placement="right"
      @close="showConfig = false"
      :visible="showConfig"
    >
      <div slot="title" >Redis配置详情</div>
      <a-list bordered style="max-height: 88vh; overflow: auto" :dataSource="configData">
        <a-list-item slot="renderItem" slot-scope="item">
          <a slot="actions">{{item.value}}</a>
          {{item.key}}
        </a-list-item>
      </a-list>
    </a-drawer>
  </div>
</template>

<script>
import moment from 'moment'
import {mapState, mapMutations} from 'vuex'
import C from "@/config"
import U from "@/utils"

export default {
  name: 'RedisInfo',
  data() {
    return {
      moment: moment,
      formatSeconds: U.formatSeconds,
      showConfig: false,
      configData: [],
      logs_loading: false,
      clients_loading: false,
      logs_data: [],
      clients_data: [],
      logs_columns: [
        {
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
          sorter: (a, b) => a.time_used - b.time_used,
          sortDirections: ['descend'],
        }, {
          title: '日志详情',
          dataIndex: 'msg',
        }
      ],
      clients_columns: [
        {
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
        }
      ],
    }
  },
  watch: {
    redis_id(val) {
      if (val !== '') {
        this.get_redis_infos()
      }
    }
  },
  computed: {
    ...mapState(['redis_id', 'info_data']),
  },
  methods: {
    ...mapMutations(['setRedisInfo']),
    async get_config() {
      this.showConfig = true
      this.configData = []
      let comm = 'C get *'
      let body = await C.myaxios.get(`/containers?method=execute&id=${this.redis_id}&command=${comm}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        let output = body.data.data
        for (let i = 0; i < output.length; i += 2) {
          if (output[i] === 'client-output-buffer-limit') {
            let buffers = output[i + 1].split(' ')
            this.configData.push({'key': `${output[i]}-${buffers[0]}`, 'value': `${buffers[1]} ${buffers[2]} ${buffers[3]}`})
            this.configData.push({'key': `${output[i]}-${buffers[4]}`, 'value': `${buffers[5]} ${buffers[6]} ${buffers[7]}`})
            this.configData.push({'key': `${output[i]}-${buffers[8]}`, 'value': `${buffers[9]} ${buffers[10]} ${buffers[11]}`})
          } else {
            this.configData.push({'key': output[i], 'value': output[i + 1]})
          }
        }
      } else {
        this.$message.error(body.data.msg)
      }
    },
    format_db_nums(str) {
      if (str === undefined) return 0
      if (str === "") return 0
      let s = str.split(',')[0]
      return s.split('=')[1]
    },
    async get_info() {
      let body = await C.myaxios.get(`/containers?method=info&id=${this.redis_id}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.setRedisInfo({'info_data': body.data.data})
      } else {
        this.$message.error(body.data.msg)
      }
    },
    async get_logs() {
      this.logs_loading = true
      let body = await C.myaxios.get(`/containers?method=logs&id=${this.redis_id}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.logs_data = body.data.data
        this.logs_loading = false
      } else {
        this.$message.error(body.data.msg)
      }
    },
    async get_clients() {
      this.clients_loading = true
      let body = await C.myaxios.get(`/containers?method=clients&id=${this.redis_id}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.clients_data = body.data.data
        this.clients_loading = false
      } else {
        this.$message.error(body.data.msg)
      }
    },
    get_redis_infos() {
      this.get_info()
      this.get_logs()
      this.get_clients()
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .gridcard {
    width: 50%;
    textAlign: 'left';
  }
  .gridcard25 {
    width: 25%;
    textAlign: 'left';
  }
  .ant-card-grid {
    padding: 12px !important;
  }
</style>
