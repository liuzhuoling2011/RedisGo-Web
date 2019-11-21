<template>
  <div>
    <a-row type="flex" justify="center">
      <a-col span="6">
        <a-row :gutter="8" type="flex" justify="space-between">
          <a-col span="8">
            <a-tooltip title="数据库选择">
              <a-select style="width: 100%" :value="redis_db" @change="change_db">
                <a-select-option v-for="item in dbs" :value="item.value" v-bind:key="item.value">{{item.label}}</a-select-option>
              </a-select>
            </a-tooltip>
          </a-col>
          <a-col span="10">
            <a-tooltip title="请输入要搜索的Key">
              <a-input-search style="width: 100%" v-model="search_key" placeholder="请输入要搜索的Key" @search="search_keys" />
            </a-tooltip>
          </a-col>
          <a-col span="6" style="text-align: right">
            <a-button icon="plus" @click="add_key_click">添加元素</a-button>
          </a-col>
        </a-row>

        <div style="margin-top: 10px"/>
        <a-list bordered :dataSource="keys" style="max-height: 80vh; overflow: auto;">
          <a-list-item slot="renderItem" slot-scope="item" @click="click_item(item)">
            <a-list-item-meta>
              <a slot="title">
                <a-tooltip :key="item['name']" :title="item['type']+' 类型: '+item['name']">
                  <a-tag v-if="item['type']==='string'" class="tagstyle" color="green">String</a-tag>
                  <a-tag v-if="item['type']==='list'" class="tagstyle" color="blue">List</a-tag>
                  <a-tag v-if="item['type']==='set'" class="tagstyle" color="pink">Set</a-tag>
                  <a-tag v-if="item['type']==='zset'" class="tagstyle" color="red">ZSet</a-tag>
                  <a-tag v-if="item['type']==='hash'" class="tagstyle" color="cyan">Hash</a-tag>
                  {{item['name'].length > 25 ? `${item['name'].slice(0, 25)}...` : item['name']}}
                </a-tooltip>
              </a>
            </a-list-item-meta>
            <div slot="actions">Len: {{item['len']}} | TTL: {{formatSeconds(item['ttl'] / 1000000000)}}</div>
          </a-list-item>
        </a-list>
      </a-col>

      <a-col offset="1" span="12">
        <a-row :gutter="8" type="flex" justify="space-between">
          <a-col span="8">
            <a-tooltip title="Key的名称">
              <a-input-group>
                <a-input :value="temp_key_item.type.toUpperCase()" style="width: 22%" disabled/>
                <a-input style="width: 75%" placeholder="名称" v-model="temp_key_item.name" @pressEnter="rename_key">
                  <a-icon type="check" slot="suffix" @click="rename_key"/>
                </a-input>
              </a-input-group>
            </a-tooltip>
          </a-col>
          <a-col span="3">
            <a-tooltip title="过期时间, -1 为永久, 单位: 秒">
              <a-input style="width: 100%" placeholder="过期时间" v-model="temp_key_item.ttl" @pressEnter="update_ttl">
                <a-icon type="check" slot="suffix" @click="update_ttl"/>
              </a-input>
            </a-tooltip>
          </a-col>
          <a-col span="4">
            <a-button-group style="width: 100%">
              <a-tooltip title="编辑内容" v-if="temp_key_item.type === 'string'">
                <a-button icon="edit" @click="edit_value" style="width: 30%; color: blue"/>
              </a-tooltip>
              <a-tooltip title="刷新">
                <a-button icon="sync" @click="refresh" style="width: 30%; color: green"/>
              </a-tooltip>
              <a-tooltip title="删除Key">
                <a-button icon="delete" @click="rm_key" style="width: 30%; color: red"/>
              </a-tooltip>
            </a-button-group>
          </a-col>
          <a-col span="5">
            <a-button-group v-if="temp_key_item.type === 'string'">
              <a-tooltip title="以初始文字形式展示">
                <a-button @click="show_text">Text</a-button>
              </a-tooltip>
              <a-tooltip title="以Json形式展示">
                <a-button @click="show_json">Json</a-button>
              </a-tooltip>
              <a-tooltip title="以json压缩形式展示">
                <a-button @click="show_zip">Zip</a-button>
              </a-tooltip>
            </a-button-group>
          </a-col>
          <a-col span="4" style="text-align: right">
            <a-button type="primary" @click="comform_edit" v-if="edit_mode">确认</a-button>
            <a-button type="error" @click="cancel_edit" v-if="edit_mode">取消</a-button>
          </a-col>
        </a-row>
        <div style="margin-top: 10px"/>
        <div style="max-height: 80vh; overflow: auto;">
          <div class="spin-content" v-if="present_spin">
            <a-spin :spinning="present_spin"></a-spin>
          </div>
          <div v-else>
            <div v-if="temp_key_item.type === 'string'">
              <div v-if="!edit_mode" >
                <json-view v-if="json_view_flag" :data="temp_key_item.key_value" />
                <pre v-else>{{temp_key_item.key_value}}</pre>
              </div>
              <a-textarea v-else v-model="temp_key_item.key_value" :rows="60" style="max-height: 80vh; overflow: auto;" placeholder="暂无内容" />
            </div>
            <div v-if="temp_key_item.type === 'hash'">
              <a-list bordered :dataSource="hash_key_value">
                <a-list-item slot="renderItem" slot-scope="item">
                  <a-list-item-meta :description="item[1]">
                    <a slot="title">{{item[0]}}</a>
                  </a-list-item-meta>
                  <div slot="actions">
                    <a-tag color="blue" @click="format_json(item[1])">JSON</a-tag>
<!--                    <a-tag color="green" @click="format_json(item[1])">编辑</a-tag>-->
<!--                    <a-tag color="red" @click="format_json(item[1])">删除</a-tag>-->
                  </div>
                </a-list-item>
              </a-list>
            </div>
            <div v-if="temp_key_item.type === 'list' || temp_key_item.type === 'set'">
              <a-list bordered :dataSource="temp_key_item.key_value">
                <a-list-item slot="renderItem" slot-scope="item">
                  <a-list-item-meta :description="item">
                  </a-list-item-meta>
                  <div slot="actions">
                    <a-tag color="blue" @click="format_json(item)">JSON</a-tag>
<!--                    <a-tag color="green" @click="format_json(item)">编辑</a-tag>-->
<!--                    <a-tag color="red" @click="format_json(item)">删除</a-tag>-->
                  </div>
                </a-list-item>
              </a-list>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>
    <a-modal v-model="showJsonModal" :footer="null" :destroyOnClose="true" width="50vw">
      <json-view :data="jsonDataModal" style="margin-top: 20px; overflow: auto; max-height: 72vh"/>
    </a-modal>
  </div>
</template>

<script>
// import moment from 'moment'
import config from '../config'
import utils from "../utils";
import jsonView from 'vue-json-views'
import {mapState, mapMutations} from 'vuex'

export default {
  name: 'RedisData',
  data() {
    return {
      url: config.base_url,
      // eslint-disable-next-line no-console
      log: console.log,
      formatSeconds: utils.formatSeconds,
      redis_db: 0,
      search_key: "*",
      keys: [],
      present_mode: 'Text',
      present_spin: false,
      json_view_flag: false,
      jsonDataModal: null,
      showJsonModal: false,
      edit_mode: false,
      origin_key_item: {name: "", type: 'None', len: 0, ttl: -1, key_value: '暂无内容'},
      temp_key_item: {name: "", type: 'None', len: 0, ttl: -1, key_value: '暂无内容'},
    }
  },
  components: { jsonView },
  computed: {
    ...mapState(['redis_ip', 'info_data']),
    dbs: function () {
      let all_db = []
      for (let i = 0; i < 16; i++) {
        all_db.push({'value': i, 'label': `DB${i} (${this.format_db_nums(this.info_data['db'+i])} keys)`})
      }
      return all_db
    },
    hash_key_value: function () {
      let kvs = []
      for (let i in this.temp_key_item.key_value) {
        kvs.push([i, this.temp_key_item.key_value[i]]);
      }
      return kvs
    }
  },
  methods: {
    ...mapMutations(['setRedisInfo']),
    format_db_nums(str) {
      if (str === undefined) return 0
      if (str === "") return 0
      let s = str.split(',')[0]
      return s.split('=')[1]
    },
    async change_db(value) {
      this.redis_db = value
      const body = await config.myaxios.get(`data?method=select_db&ip=${this.redis_ip}&db=${this.redis_db}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        if (body.data.data === "OK") {
          this.$message.success(`成功切换至DB${value}`)
          await this.search_keys()
        }
      }
    },
    async get_info() {
      const body = await config.myaxios.get(`containers?method=info&ip=${this.redis_ip}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.setRedisInfo({'info_data': body.data.data})
      }
    },
    async search_keys() {
      const body = await config.myaxios.get(`data?method=get_keys&ip=${this.redis_ip}&key=${this.search_key}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.keys = body.data.data === null? [] : body.data.data
      }
    },
    async edit_value() {
      this.edit_mode = true
      if (typeof this.temp_key_item.key_value === "object") {
        this.temp_key_item.key_value = JSON.stringify(this.temp_key_item.key_value, null, 4)
      }
    },
    add_key_click() {
      this.$message.warning("添加key功能暂未实现, 请耐心等待")
    },
    async rm_key() {
      const body = await config.myaxios.get(`data?method=rm_key&ip=${this.redis_ip}&key=${this.origin_key_item.name}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        if (body.data.data === 1) {
          this.$message.success("删除成功")
          await this.search_keys()
          this.origin_key_item.name = ''
          this.origin_key_item.ttl = -1
          this.origin_key_item.key_value = '暂无内容'
          this.temp_key_item.name = ''
          this.temp_key_item.ttl = -1
          this.temp_key_item.key_value = '暂无内容'
        }
      }
    },
    cancel_edit() {
      this.edit_mode = false
      if (this.present_mode === 'Json') {
        this.temp_key_item.key_value = JSON.parse(this.temp_key_item.key_value)
      }
    },
    async comform_edit() {
      await this.set_string_value(this.temp_key_item.name, this.temp_key_item.key_value)
    },
    async refresh() {
      await this.get_ttl()
      await this.get_key_value(this.origin_key_item.name, this.origin_key_item.type)
    },
    async rename_key() {
      const body = await config.myaxios.get(`data?method=rename&ip=${this.redis_ip}&key=${this.origin_key_item.name}&new_name=${this.temp_key_item.name}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        if (body.data.data === true || body.data.data === "OK") {
          this.$message.success('重命名成功')
          this.origin_key_item.name = this.temp_key_item.name
          await this.search_keys()
        } else {
          this.$message.error('重命名失败: ' + body.data.data)
        }
      }
    },
    async update_ttl(value) {
      const body = await config.myaxios.get(`data?method=update_ttl&ip=${this.redis_ip}&key=${this.origin_key_item.name}&ttl=${value}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        if (body.data.data === true || body.data.data === "OK") {
          this.$message.success('更新超时时间成功')
          await this.search_keys()
        }
      }
    },
    async get_ttl() {
      const body = await config.myaxios.get(`data?method=get_ttl&ip=${this.redis_ip}&key=${this.origin_key_item.name}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.origin_key_item.ttl = parseInt(body.data.data / 1000000000)
        this.temp_key_item.ttl = parseInt(body.data.data / 1000000000)
      }
    },
    async click_item(item) {
      this.json_view_flag = false
      this.origin_key_item.ttl = parseInt(item.ttl / 1000000000)
      this.origin_key_item.type = item.type
      this.origin_key_item.name = item.name
      this.origin_key_item.len = item.len

      this.temp_key_item.ttl = parseInt(item.ttl / 1000000000)
      this.temp_key_item.type = item.type
      this.temp_key_item.name = item.name
      this.temp_key_item.len = item.len
      if (item.type === 'zset') {
        this.$message.warning('目前不支持zset类型的数据')
        return
      }
      await this.get_key_value(item.name, item.type)
      this.present_mode = 'Text'
    },
    async get_key_value(name, type) {
      this.present_spin = true
      const body = await config.myaxios.get(`data?method=get_key_value&ip=${this.redis_ip}&key=${name}&type=${type}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.present_spin = false
        this.origin_key_item.key_value = body.data.data === null? [] : body.data.data
        this.temp_key_item.key_value = body.data.data === null? [] : body.data.data
      }
    },
    format_json(json_data) {
      let jsonData = utils.parse_json(json_data)
      if (jsonData !== null) {
        this.jsonDataModal = jsonData
        this.showJsonModal = true
      } else {
        this.$message.error('不支持该类型数据的JSON展示')
      }
    },
    show_json() {
      if (!this.edit_mode) {
        if (typeof this.temp_key_item.key_value !== "object") {
          let jsonData = utils.parse_json(this.temp_key_item.key_value)
          if (jsonData !== null) {
            this.temp_key_item.key_value = jsonData
            this.present_mode = 'Json'
          } else {
            this.$message.error('不支持该类型数据的JSON展示')
            return
          }
        }
        this.json_view_flag = true
      } else {
        if (typeof this.temp_key_item.key_value === "object") {
          this.temp_key_item.key_value = JSON.stringify(this.temp_key_item.key_value, null, 4)
          this.present_mode = 'Json'
        } else {
          let jsonData = utils.parse_json(this.temp_key_item.key_value)
          if (jsonData !== null) {
            this.temp_key_item.key_value = JSON.stringify(jsonData, null, 4)
            this.present_mode = 'Json'
          } else {
            this.$message.error('不支持该类型数据的JSON展示')
          }
        }
      }
    },
    show_zip() {
      this.json_view_flag = false
      if (typeof this.temp_key_item.key_value === "object") {
        this.temp_key_item.key_value = JSON.stringify(this.temp_key_item.key_value)
        this.present_mode = 'Zip'
      } else {
        let jsonData = utils.parse_json(this.temp_key_item.key_value)
        if (jsonData !== null) {
          this.temp_key_item.key_value = JSON.stringify(jsonData)
          this.present_mode = 'Zip'
        } else {
          this.$message.error('不支持该类型数据的JSON展示')
        }
      }
    },
    show_text() {
      this.json_view_flag = false
      this.temp_key_item.key_value = this.origin_key_item.key_value
      this.present_mode = 'Text'
    },
    async set_string_value(key, value) {
      const body = await config.myaxios.get(`data?method=string_ops&ops=set&ip=${this.redis_ip}&key=${key}&value=${value}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        if (body.data.data === "OK") {
          this.$message.success("修改成功")
        }
      }
    },
    async push_list_value(key, pos, value) {
      const body = await config.myaxios.get(`data?method=list_ops&ops=push&ip=${this.redis_ip}&key=${key}&pos=${pos}&value=${value}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.log(body.data.data)
      }
    },
    async delete_list_value(key, pos) {
      const body = await config.myaxios.get(`data?method=list_ops&ops=delete&ip=${this.redis_ip}&key=${key}&pos=${pos}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.log(body.data.data)
      }
    },
    async set_list_value(key, pos, value) {
      const body = await config.myaxios.get(`data?method=list_ops&ops=set&&ip=${this.redis_ip}&key=${key}&pos=${pos}&value=${value}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.log(body.data.data)
      }
    }

  },
  mounted() {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tagstyle {
  width: 55px;
  text-align: center;
}
.spin-content {
  text-align: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 20px;
  padding: 30px 50px;
  margin: 20px 0;
}
pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; white-space: pre-wrap; word-wrap: break-word;}
.string { color: green; }
.number { color: darkorange; }
.boolean { color: blue; }
.null { color: magenta; }
.key { color: red; }
</style>
