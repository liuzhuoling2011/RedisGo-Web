<template>
  <div>
    <a-modal title="新增数据" v-model="show_modal" okText="确认" cancelText="取消" @ok="add_redis_key_data_commit" :destroyOnClose="true" width="500px">
      <a-input-group style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px">数据键名: </span>
        <a-select v-model="add_redis_key.type" showSearch style="width: 80px">
          <a-select-option v-for="s of redis_key_type" :value="s">{{s}}</a-select-option>
        </a-select>
        <a-input v-model="add_redis_key.name" style="width: 280px"/>
      </a-input-group>
      <a-input-group style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px">过期时间: </span>
        <a-input-number v-model="add_redis_key.ttl" placeholder="-1 为永久, 单位: 秒" :precision="0" style="width: 360px"/>
      </a-input-group>
      <a-input-group v-if="add_redis_key.type==='ZSet'" style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px">数据分数: </span>
        <a-input-number v-model="add_redis_key.score" placeholder="整数, 作为排序依据" :precision="0" :min="0" :max="1000000000" style="width: 360px"/>
      </a-input-group>
      <a-input-group v-if="add_redis_key.type==='Hash'" style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px">哈希键值: </span>
        <a-input v-model="add_redis_key.key" style="width: 360px"/>
      </a-input-group>
      <a-input-group style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px">数据详情: </span>
        <a-textarea v-model="add_redis_key.value" :rows="6" style="width: 360px"/>
      </a-input-group>
      <a-input-group style="margin-top: 8px" compact>
        <span style="font-size: 16px; width: 80px"></span>
        <a-checkbox v-model="add_redis_key.zip_json" @change="try_zip_json">尝试压缩JSON文本</a-checkbox>
      </a-input-group>
    </a-modal>
  </div>
</template>

<script>
import C from "@/config"
import { mapState, mapMutations, mapActions } from "vuex"
import U from "@/utils";

export default {
  name: "AddDataModal",
  props: { search_keys: Function },
  data() {
    return {
      show_modal: false,
      redis_key_type: ['String', 'List', 'Hash', 'Set', 'ZSet'],
      add_redis_key: {name: '', type: 'String', ttl: -1, score: 0, key: '', value: '', zip_json: false}
    }
  },
  computed: {
    ...mapState(["redis_id"])
  },
  methods: {
    ...mapMutations(["setStateData"]),
    ...mapActions(["getRedisInfo"]),
    show() {
      this.show_modal = true
    },
    async add_redis_key_data_commit() {
      let data = this.add_redis_key
      if (data.name === '' || data.value === '') {
        this.$message.error('名称或数据为空, 请检查再试')
      }
      // 执行错误, 请检查输入的Redis命令
      if (data.ttl === '' || data.ttl === null) { data.ttl = -1 }
      let body = undefined
      let success = false
      let prefix = `data?id=${this.redis_id}&method=`
      if (data.type === 'String') {
        body = await C.myaxios.get(prefix + `string_ops&ops=set&key=${data.name}&value=${data.value}&ttl=${data.ttl}`)
        if (body.status === 200 && body.data && body.data.code === 0 && body.data.data === 'OK') {
          success = true
        }
      } else if (data.type === 'List') {
        body = await C.myaxios.get(prefix + `list_ops&ops=new&key=${data.name}&pos=-1&value=${data.value}&ttl=${data.ttl}`)
        if (body.status === 200 && body.data && body.data.code === 0 && body.data.data > 0) {
          success = true
        } else {
          body.data.data = '执行失败, 请检查是否键名冲突'
        }
      } else if (data.type === 'Hash') {
        body = await C.myaxios.get(prefix + `hash_ops&ops=new&key=${data.name}&hash_key=${data.key}&value=${data.value}&ttl=${data.ttl}`)
        if (body.status === 200 && body.data && body.data.code === 0 && body.data.data) {
          success = true
        } else {
          body.data.data = '执行失败, 请检查是否键名冲突'
        }
      } else if (data.type === 'Set') {
        body = await C.myaxios.get(prefix + `set_ops&ops=new&key=${data.name}&set_key=${data.key}&value=${data.value}&ttl=${data.ttl}`)
        if (body.status === 200 && body.data && body.data.code === 0 && body.data.data > 0) {
          success = true
        } else {
          body.data.data = '执行失败, 请检查是否键名冲突'
        }
      } else if (data.type === 'ZSet') {
        body = await C.myaxios.get(prefix + `zset_ops&ops=new&key=${data.name}&zset_key=${data.value}&value=${data.score}&ttl=${data.ttl}`)
        if (body.status === 200 && body.data && body.data.code === 0 && body.data.data > 0) {
          success = true
        } else {
          body.data.data = '执行失败, 请检查是否键名冲突'
        }
      }
      if (success) {
        this.$message.success('执行成功')
        this.show_modal = false
        await this.getRedisInfo()
        await this.search_keys()
      } else {
        this.$message.error(body.data.data)
      }
    },
    try_zip_json() {
      if (this.add_redis_key.zip_json) {
        let jsonData = U.parse_json(this.add_redis_key.value)
        if (jsonData !== null) {
          this.add_redis_key.value_tmp = this.add_redis_key.value
          this.add_redis_key.value = JSON.stringify(jsonData)
        } else {
          this.$message.error('不支持该类型数据的JSON展示')
          this.add_redis_key.zip_json = false
        }
      } else {
        this.add_redis_key.value = this.add_redis_key.value_tmp
      }
    }
  },
  async mounted() {

  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
