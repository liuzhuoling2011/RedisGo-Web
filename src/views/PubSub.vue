<template>
  <div>
    <a-row style="padding-top: 10px">
      <a-col :span="16" style="padding-right: 10px">
        <div class="redis-output-container">
          <a-list bordered style="background-color: white"
            :dataSource="redis_output[redis_id]"
          >
            <div slot="header">
              <b>Redis输出信息:</b>
              <a-tag style="position: absolute; right: 24px;" color="red"
                @click="delete_pubsub_output(-1)"
              >
                清空信息
              </a-tag>
            </div>
            <a-list-item slot="renderItem" slot-scope="item, index">
              <a-list-item-meta :description="item[1]">
                <a slot="title">接收通道: {{ item[0] }}</a>
              </a-list-item-meta>
              <div slot="actions">
                <a @click="format_json(item[1])">JSON</a>
                <a-divider type="vertical" />
                <a @click="delete_pubsub_output(index)" style="color: lightsalmon">删除</a>
              </div>
            </a-list-item>
          </a-list>
        </div>
      </a-col>
      <a-col :span="8" style="padding-top: 8px">
        <a-input
          v-model="pubsub_key"
          style="margin-bottom: 8px"
          placeholder="发布/订阅的Channel"
        />
        <a-textarea
          v-model="pubsub_msg"
          :rows="10"
          style="margin-bottom: 8px"
          :placeholder="pubsub_msg_placeholder"
        />
        <a-button type="primary" @click="publish_msg" style="background: #108ee9; border-color: #108ee9">发布</a-button>
        <a-button type="primary" @click="subscribe_msg" style="background: #87d068; border-color: #87d068; margin-left: 5px">订阅</a-button>

        <a-divider>发布列表</a-divider>
        <div style="line-height: 2; max-height: 22vh; overflow: auto">
          <template v-for="tag in publish_keys[redis_id]">
            <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
              <a-tag color="#108ee9" :key="tag"
                @click="copyPublishMsg(tag)"
                :closable="true"
                :afterClose="() => handlePubClose(tag)"
              >
                {{ `${tag.slice(0, 80)}...` }}
              </a-tag>
            </a-tooltip>
            <a-tag color="#108ee9" v-else
              :key="tag"
              @click="copyPublishMsg(tag)"
              :closable="true"
              :afterClose="() => handlePubClose(tag)"
            >
              {{ tag }}
            </a-tag>&nbsp;&nbsp;
          </template>
        </div>
        <a-divider>订阅列表</a-divider>
        <div style="line-height: 2; max-height: 22vh; overflow: auto">
          <template v-for="tag in subscribe_keys_show">
            <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
              <a-tag color="#87d068"
                :key="tag"
                @click="pubsub_key = tag"
                :closable="true"
                :afterClose="() => handleTagClose(tag)"
              >
                {{ `${tag.slice(0, 80)}...` }}
              </a-tag>
            </a-tooltip>
            <a-tag color="#87d068" v-else
              :key="tag"
              @click="pubsub_key = tag"
              :closable="true"
              :afterClose="() => handleTagClose(tag)"
            >
              {{ tag }}
            </a-tag>
          </template>
          <template v-for="tag in subscribe_keys_history_show">
            <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
              <a-tag color="darkgrey"
                :key="tag"
                @click="pubsub_key = tag"
                :closable="true"
                :afterClose="() => handleTagHisClose(tag)"
              >
                {{ `${tag.slice(0, 80)}...` }}
              </a-tag>
            </a-tooltip>
            <a-tag color="darkgrey" v-else
              :key="tag"
              @click="pubsub_key = tag"
              :closable="true"
              :afterClose="() => handleTagHisClose(tag)"
            >
              {{ tag }}
            </a-tag>
          </template>
        </div>
      </a-col>
    </a-row>
    <a-modal
      v-model="showJson"
      :footer="null"
      :destroyOnClose="true"
      width="50vw"
    >
      <json-view
        :data="jsonData"
        style="margin-top: 20px; overflow: auto; max-height: 72vh"
      />
    </a-modal>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex"
import jsonView from "vue-json-views"
import C from "@/config"
import U from "@/utils"
export default {
  name: "PubSub",
  data() {
    return {
      subscribe_keys_flag: {},
      publish_keys: {},
      pubsub_key: "",
      pubsub_msg: "",
      pubsub_msg_placeholder:
        '需要发布的信息, 可以直接放上可读的Json, 例如:\n{\n  "ABC": [\n    "123456",\n    "234567",\n    "345678",\n  ],\n  "DEF": ["567890"]\n}',
      jsonData: "",
      showJson: false
    };
  },
  components: { jsonView },
  computed: {
    ...mapState([
      "redis_id",
      "subscribe_keys",
      "subscribe_keys_history",
      "redis_output"
    ]),
    subscribe_keys_show: function() {
      if (this.subscribe_keys[this.redis_id] === undefined) return []
      return this.subscribe_keys[this.redis_id]
    },
    subscribe_keys_history_show: function() {
      if (this.subscribe_keys_history[this.redis_id] === undefined) return []
      return this.subscribe_keys_history[this.redis_id]
    }
  },
  methods: {
    ...mapMutations([
      "sendWebsocketMsg",
      "setPubsubKeys",
      "removePubsubOutput"
    ]),
    format_json(json_data) {
      let jsonData = U.parse_json(json_data)
      if (jsonData !== null) {
        this.jsonData = jsonData
        this.showJson = true
      } else {
        this.$message.error("不支持该类型数据的JSON展示")
      }
    },
    delete_pubsub_output(index) {
      if (index === -1) {
        this.removePubsubOutput({ remove_all: true })
      } else {
        this.removePubsubOutput({ index: index })
      }
    },
    publish_msg() {
      if (this.redis_id === "") {
        this.$message.warning("未检测到有效的Redis连接, 请在设置中添加", 10)
        return
      }
      if (this.pubsub_key === "") {
        this.$message.error("请输入Channel再试")
        return
      }
      C.myaxios
        .get(`/containers?method=publish&id=${this.redis_id}&key=${encodeURIComponent(this.pubsub_key)}&msg=${encodeURIComponent(this.pubsub_msg)}`)
        .then(result => {
          let res = result.data;
          if (res.code !== 0) {
            this.$message.error(res.msg);
          } else {
            this.$message.success(`${this.redis_id} => ${res.msg} 发布成功`);
            if (this.publish_keys[this.redis_id] === undefined) {
              this.$set(this.publish_keys, this.redis_id, []);
            }
            if (
              this.publish_keys[this.redis_id].indexOf(
                res.msg + " | " + res.data
              ) === -1
            ) {
              this.publish_keys[this.redis_id].push(res.msg + " | " + res.data);
              localStorage.setItem(
                "publish_keys",
                JSON.stringify(this.publish_keys)
              );
            }
          }
        });
    },
    subscribe_msg() {
      if (this.redis_id === "") {
        this.$message.warning("未检测到有效的Redis连接, 请在设置中添加并刷新页面", 10)
        return
      }
      if (this.pubsub_key === "") {
        this.$message.error("请输入Channel再试")
        return
      }
      if (this.subscribe_keys_flag[this.redis_id] === undefined) {
        this.$set(this.subscribe_keys_flag, this.redis_id, {})
      }
      if (this.subscribe_keys_flag[this.redis_id][this.pubsub_key] === undefined) {
        this.sendWebsocketMsg({
          type: 2,
          ip: this.redis_id,
          channel: this.pubsub_key,
          command: "open"
        })
        this.$set(this.subscribe_keys_flag[this.redis_id], this.pubsub_key, true)
      } else {
        this.$message.error(`${this.redis_id} => 已经订阅 ${this.pubsub_key}, 无需重复订阅`)
      }
    },
    copyPublishMsg(val) {
      let key_val = val.split(" | ")
      this.pubsub_key = key_val[0]
      this.pubsub_msg = key_val[1]
    },
    handlePubClose(removedTag) {
      const tags = this.publish_keys[this.redis_id].filter(tag => tag !== removedTag)
      this.$set(this.publish_keys, this.redis_id, tags)
      localStorage.setItem("publish_keys", JSON.stringify(this.publish_keys))
    },
    handleTagClose(removedTag) {
      if (this.subscribe_keys_flag[this.redis_id][removedTag]) {
        this.sendWebsocketMsg({
          type: 2,
          ip: this.redis_id,
          channel: removedTag,
          command: "close"
        })
        delete this.subscribe_keys_flag[this.redis_id][removedTag]
      }
    },
    handleTagHisClose(removedTag) {
      const tags = this.subscribe_keys_history[this.redis_id].filter(tag => tag !== removedTag)
      this.setPubsubKeys({
        redis_id: this.redis_id,
        subscribe_keys_history: tags
      })
    },
    onDestroy() {
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
      localStorage.setItem("subscribe_keys", JSON.stringify(save_subscribe_keys))
    }
  },
  mounted() {
    window.onbeforeunload = this.onDestroy;
    let publish_keys = localStorage.getItem("publish_keys")
    if (publish_keys !== null) {
      this.publish_keys = JSON.parse(publish_keys)
    }

    let subscribe_keys = localStorage.getItem("subscribe_keys")
    if (subscribe_keys !== null) {
      this.setPubsubKeys({subscribe_keys_history: JSON.parse(subscribe_keys)})
    }
  }
}
</script>

<style scoped>
.ant-list-item-meta-description {
  word-break: break-all;
}
</style>
