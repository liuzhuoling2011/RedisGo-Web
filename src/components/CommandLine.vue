<template>
  <div>
    <a-drawer
      height="509"
      placement="bottom"
      @close="command_visible = false"
      :visible="command_visible"
    >
      <div slot="title">
        Redis终端 (请不要执行带阻塞性质的命令 例如: BLPOP, SUBSCRIBE)
      </div>
      <!--            <a-textarea id="redis_command_output" v-model="redis_command_output" placeholder="Redis命令输出" :rows="16" style="background: silver;word-break: break-all;"/>-->
      <pre id="redis_command_output" style="height: 350px;white-space: pre-wrap; word-wrap: break-word;">{{ redis_command_output }}</pre>
      <a-auto-complete placeholder="请输入执行的命令" style="width: 100%;margin-top: 10px"
        :data-source="redis_command_list"
        :backfill="true"
        :filter-option="filterOption"
        :defaultActiveFirstOption="false"
      >
        <a-input-search placeholder="请输入执行的命令" allowClear
          slot="default"
          v-model="redis_command"
          @search="execute_command"
        >
          <a-button slot="enterButton" type="primary">执行</a-button>
        </a-input-search>
      </a-auto-complete>
    </a-drawer>
  </div>
</template>

<script>
import moment from "moment"
import { mapState } from "vuex"
import C from "@/config"
export default {
  name: "CommandLine",
  data() {
    return {
      redis_command: "",
      redis_command_output: "",
      redis_command_list: [],
      command_visible: false
    };
  },
  computed: {
    ...mapState(["redis_id"])
  },
  methods: {
    filterOption(input, option) {
      return (
          option.componentOptions.children[0].text.toUpperCase().indexOf(input.toUpperCase()) >= 0
      );
    },
    showCommand() {
      this.command_visible = true
      this.redis_command_list = []
      let redis_command_list = localStorage.getItem('redis_command_list')
      if (redis_command_list !== null) {
        this.redis_command_list = JSON.parse(redis_command_list)
      }
    },
    async execute_command() {
      if (this.redis_command === '') return
      const body = await C.myaxios.get(`containers?method=execute&id=${this.redis_id}&command=${this.redis_command}`)
      if (body.status === 200 && body.data && body.data.code === 0) {
        let find = this.redis_command_list.findIndex(e => e === this.redis_command)
        if (find >= 0) {
          this.redis_command_list.splice(find, 1)
        }
        this.redis_command_list.unshift(this.redis_command)
        localStorage.setItem('redis_command_list', JSON.stringify(this.redis_command_list))

        let output = body.data.data
        if (Array.isArray(output)) {
          output = output.join(", ")
        }
        this.redis_command_output += `${moment().format("YYYY-MM-DD HH:mm:ss")}\t${output}\n`
        setTimeout(() => {
          const textarea = document.getElementById("redis_command_output")
          textarea.scrollTop = textarea.scrollHeight;
        }, 100)
      }
    }
  }
};
</script>

<style scoped></style>
