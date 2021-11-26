<template>
  <div>
    <a-drawer width="560" placement="right"
      @close="visible = false"
      :visible="visible"
    >
      <div slot="title">
        Redis连接管理 <a-divider type="vertical" />
        <a-button icon="plus" style="color: #42b983" @click="add_container">添加连接</a-button>
      </div>
      <a-card>
        <template v-for="(item, key) in containers">
          <a-card-grid :key="key" class="gridcard100">
            <a-row>
              <a-col span="2">
                <a-tooltip v-if="item.status === 0">
                  <template slot="title">连接正常</template>
                  <a-icon type="check" style="font-size: 22px; color: #87d068"/>
                </a-tooltip>
                <a-tooltip v-else>
                  <template slot="title">连接失败, 请检查配置信息或者网络</template>
                  <a-icon type="stop" style="font-size: 22px; color: orangered"/>
                </a-tooltip>
              </a-col>
              <a-col span="18">
                <a-tooltip :key="item.name" :title="item.name">
                  名称: <a-tag color="green"> {{item.name.length > 16 ? `${item.name.slice(0, 16)}...` : item.name}}</a-tag>
                </a-tooltip>
                <a-divider type="vertical" />
                <a-tooltip :key="item.ip" :title="item.ip">
                  IP: <a-tag color="blue"> {{item.ip.length > 16 ? `${item.ip.slice(0, 16)}...` : item.ip}}</a-tag>
                </a-tooltip> <br />
                端口: {{ item.port }} <a-divider type="vertical" />
                DB: {{ item.db }}
<!--                <a-divider type="vertical" />密码: {{ item.password }}-->
              </a-col>
              <a-col span="4">
                <a @click="edit_container(item)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm
                    title="确认删除吗?" ok-text="确认" cancel-text="取消"
                    @confirm="delete_container(item.id)"
                >
                  <a style="color: lightsalmon">删除</a>
                </a-popconfirm>
              </a-col>
            </a-row>
          </a-card-grid>
        </template>
      </a-card>
    </a-drawer>
    <a-drawer width="280"
      :title="children_drawl_name"
      @close="visible_children = false"
      :visible="visible_children"
    >
      <a-input placeholder="连接IP" size="large" allowClear
        v-model="container_tmp.ip"
        :disabled="children_drawl_name === '修改连接'"
        @change="update_info(false)"
        @pressEnter="press_enter"
      >
        <a-icon slot="prefix" type="api" />
      </a-input>
      <a-input placeholder="连接名称" size="large" allowClear
        v-model="container_tmp.name"
        style="margin-top: 10px"
        @pressEnter="press_enter"
      >
        <a-icon slot="prefix" type="user" />
      </a-input>
      <a-input size="large" allowClear
        :placeholder="children_drawl_name !== '修改连接' ? '密码': '若不修改, 请留空'"
        v-model="container_tmp.password"
        style="margin-top: 10px"
        @pressEnter="press_enter"
      >
        <a-icon slot="prefix" type="warning" />
      </a-input>
      <a-input placeholder="端口" size="large" allowClear
        v-model="container_tmp.port"
        style="margin-top: 10px"
        :disabled="children_drawl_name === '修改连接'"
        @pressEnter="press_enter"
      >
        <a-icon slot="prefix" type="appstore" />
      </a-input>
      <a-input placeholder="DB" size="large" allowClear
        v-model="container_tmp.db"
        :disabled="children_drawl_name === '修改连接'"
        style="margin-top: 10px"
        @pressEnter="press_enter"
      >
        <a-icon slot="prefix" type="hdd" />
      </a-input>
      <a-button type="primary" style="margin-top: 10px" :loading="visible_children_loading"
        @click="press_enter"
      >确认
      </a-button>
    </a-drawer>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex"
import C from "@/config"
export default {
  name: "Manage",
  data() {
    return {
      container_tmp: {id: "", ip: "", name: "", password: "", port: 6379, db: 0, status: 0},
      visible: false,
      visible_children: false,
      visible_children_loading: false,
      children_drawl_name: "新增连接"
    }
  },
  computed: {
    ...mapState(["redis_id", "containers"])
  },
  methods: {
    ...mapMutations(["setRedisIDName", "setContainer", "deleteContainer"]),
    update_info(flag = false) {
      this.container_tmp.id = this.container_tmp.ip + ":" + this.container_tmp.port
      if (!flag) {
        this.container_tmp.name = this.container_tmp.ip + ":" + this.container_tmp.port
      }
    },
    showManage() {this.visible = true},
    add_container() {
      this.visible_children = true
      this.children_drawl_name = "新增连接"
      this.container_tmp = {id: "", ip: "", name: "", password: "", port: 6379, db: 0, status: 0}
    },
    edit_container(item) {
      this.visible_children = true
      this.children_drawl_name = "修改连接"
      this.container_tmp.id = item.id
      this.container_tmp.ip = item.ip
      this.container_tmp.password = item.password
      this.container_tmp.name = item.name
      this.container_tmp.port = item.port
      this.container_tmp.db = item.db
    },
    async delete_container(id) {
      let body = await C.myaxios.post("/containers?method=delete&id=" + id)
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.$message.success("成功删除Redis连接")
        this.deleteContainer({ id: id })
        if (this.redis_id === "") {
          this.$message.warning("未检测到有效的Redis连接, 请在右上角的设置中添加", 10)
        }
      } else {
        this.$message.error(body.data.msg)
      }
    },
    async upload_add() {
      this.visible_children_loading = true
      this.update_info(true)
      let redis_conf = {
        name: this.container_tmp.name, ip: this.container_tmp.ip,
        port: parseInt(this.container_tmp.port),
        db: parseInt(this.container_tmp.db), password: this.container_tmp.password,
      }
      let body = await C.myaxios.post(`/containers?method=add`, redis_conf)
      this.visible_children_loading = false
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.setContainer({ id: this.container_tmp.id, container: body.data.data })
        this.$message.success("添加成功")
        this.visible_children = false
        if (Object.keys(this.containers).length === 1) {
          this.setRedisIDName({
            redis_id: this.container_tmp.id,
            redis_name: this.container_tmp.name
          })
        }
      } else {
        this.$message.error(body.data.msg)
      }
    },
    async upload_edit() {
      this.visible_children_loading = true
      this.update_info(true)
      let redis_conf = {
        name: this.container_tmp.name, ip: this.container_tmp.ip,
        port: parseInt(this.container_tmp.port),
        db: parseInt(this.container_tmp.db), password: this.container_tmp.password
      }
      let body = await C.myaxios.post(`containers?method=edit`, redis_conf)
      this.visible_children_loading = false
      if (body.status === 200 && body.data && body.data.code === 0) {
        this.setContainer({
          id: this.container_tmp.id,
          container: body.data.data
        })
        this.$message.success("修改成功")
        this.visible_children = false
      } else {
        this.$message.error(body.data.msg)
      }
    },
    press_enter() {
      if (this.children_drawl_name === "修改连接") {
        this.upload_edit()
      } else {
        this.upload_add()
      }
    }
  }
}
</script>

<style scoped>
.gridcard100 {
  width: 100%;
  text-align: left;
  position: relative;
  padding: 18px;
}
</style>
