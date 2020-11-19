<template>
  <div>
    <a-modal v-model="show_update" :footer="null">
      <div v-if="update_flag" slot="title">
        <a-icon type="info-circle" style="color: orange; font-size: 22px" />
        可以升级的版本如下, 下载后请替换本程序
      </div>
      <div v-else slot="title">
        <a-icon
          type="check-circle"
          style="color: lightgreen; font-size: 22px"
        />
        您目前使用的版本是最新的, 无需更新!
      </div>
      <a-list itemLayout="horizontal" :dataSource="update_version">
        <a-list-item slot="renderItem" slot-scope="item">
          <a-list-item-meta>
            <a slot="title" :href="item">{{ item }}</a>
          </a-list-item-meta>
        </a-list-item>
      </a-list>
    </a-modal>
  </div>
</template>

<script>
import C from "@/config"
import { mapState, mapMutations } from "vuex"

export default {
  name: "Update",
  data() {
    return {
      update_version: [],
      show_update: false
    }
  },
  computed: {
    ...mapState(["update_flag"])
  },
  methods: {
    ...mapMutations(["setStateData"]),
    showUpdate() {
      this.show_update = true
    },
    async checkUpdate() {
      let body = await C.myaxios.get('/system?method=update')
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.update_version = JSON.parse(body.data.data).data.filename;
        if (this.update_version === null || this.update_version.length === 1) {
          this.update_version = [];
        } else {
          this.setStateData({ type: "update_flag", data: true })
          this.update_version.shift()
          for (let i = 0; i < this.update_version.length; i++) {
            this.update_version[i] = `http://${this.update_version[i]}`
          }
          this.update_version.reverse()
        }
      } else {
        this.$message.error(body.data.msg)
      }

      let body1 = await C.myaxios.get('/system?method=notice')
      if (body1.status === 200 && body1.data && body1.data.code === 0) {
        let storage_key = "redisgo_notice_time"
        this.notices = JSON.parse(body1.data.data).data
        for (let i = 0; i < this.notices.length; i++) {
          if (
              localStorage[storage_key] == null ||
              localStorage[storage_key] < this.notices[i].CreatedAt
          ) {
            localStorage.setItem(storage_key, this.notices[i].CreatedAt);
            this.$notification["success"]({
              top: 80,
              duration: 10,
              message: "温馨提示",
              description: this.notices[i].Msg
            })
          }
        }
      } else {
        this.$message.error(body.data.msg)
      }
    }
  },
  async mounted() {
    await this.checkUpdate()
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
