<template>
  <div id="app" style="height: 100%">
    <a-layout
      id="components-layout-demo-top"
      style="height: 100%"
      class="layout"
    >
      <a-layout-header>
        <a-row>
          <a-col :span="14">
            <div class="logo" />
            <a-menu
              theme="dark"
              mode="horizontal"
              @click="menuClick"
              :defaultSelectedKeys="['redis_info']"
              :style="{ lineHeight: '64px' }"
            >
              <a-menu-item key="redis_info">
                <a-icon type="info-circle" />系统详情
              </a-menu-item>
              <a-menu-item key="redis_data">
                <a-icon type="database" />数据信息
              </a-menu-item>
              <a-menu-item key="redis_pubsub">
                <a-icon type="swap" />发布订阅
              </a-menu-item>
              <a-menu-item key="redis_monitor">
                <a-icon type="dashboard" />性能监控
              </a-menu-item>
            </a-menu>
          </a-col>
          <a-col :span="8" offset="2">
            <div style="text-align: right">
              <a-select
                :value="redis_id"
                style="width: 150px; margin: 0 20px"
                @change="change_redis"
              >
                <template v-for="item in containers">
                  <a-select-option
                    :value="item.id"
                    :key="item.id"
                    :disabled="item.status === 1"
                    >{{ item.name }}
                  </a-select-option>
                </template>
              </a-select>
              <a-dropdown>
                <a-icon
                  class="ant-dropdown-link"
                  type="setting"
                  style="color: #ffffff; font-size: 22px"
                />
                <a-menu slot="overlay" @click="settingClick">
                  <a-menu-item key="about">
                    <a-icon type="info-circle" />关于程序
                  </a-menu-item>
                  <a-menu-item key="update">
                    <a-icon type="reload" />
                    <a-badge v-if="update_flag" status="error">更新通知</a-badge>
                    <span v-else>更新通知</span>
                  </a-menu-item>
                  <a-menu-item key="edit">
                    <a-icon type="edit" />连接管理
                  </a-menu-item>
                </a-menu>
              </a-dropdown>
            </div>
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content style="padding: 10px 50px;">
        <Infos v-show="memu_key === 'redis_info'" ref="infos" />
        <Data v-show="memu_key === 'redis_data'" ref="data" />
        <PubSub v-if="memu_key === 'redis_pubsub'" ref="pubsub" />
        <Charts v-if="memu_key === 'redis_monitor'" ref="charts" />
      </a-layout-content>
    </a-layout>
    <a-button
      shape="circle"
      icon="thunderbolt"
      size="large"
      @click="show_command"
      class="command-botton"
    />

    <Update ref="update" />
    <About ref="about" />
    <Manage ref="manage" />
    <CommandLine ref="commandline" />
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex";

import Infos from "@/views/Infos";
import Data from "@/views/Data";
import Charts from "@/views/Charts";
import PubSub from "@/views/PubSub";

import About from "@/components/About";
import Update from "@/components/Update";
import Manage from "@/components/Manage";
import CommandLine from "@/components/CommandLine";

export default {
  name: "app",
  components: {Infos, Data, Charts, PubSub, About, Update, Manage, CommandLine},
  data() {
    return {
      memu_key: "",
      info_data_flags: {}
    };
  },
  computed: {
    ...mapState(["redis_id", "update_flag", "containers"])
  },
  methods: {
    ...mapMutations(["setRedisIDName", "initWS", "sendWebsocketMsg"]),
    ...mapActions(["initContainers", "updateContainerStatus"]),
    async menuClick(value) {
      this.memu_key = value.key;
      if (this.redis_id === "") {
        this.$message.warning("未检测到有效的Redis连接, 请在右上角的设置中添加", 10);
        return;
      }
      if (this.memu_key === "redis_info") {
        // this.$refs.infos.get_redis_infos();
      } else if (this.memu_key === "redis_data") {
        await this.$refs.data.get_info();
        await this.$refs.data.search_keys();
      } else if (this.memu_key === "redis_monitor") {
        this.websocket_get_redis_info();
        this.$refs.charts.resetCharts();
      } else if (this.memu_key === "redis_pubsub") {
        // todo
      } else {
        // this.$message.warning('暂未实现, 请耐心等待')
      }
    },
    settingClick(value) {
      if (value.key === "about") {
        this.$refs.about.showAbout();
      } else if (value.key === "update") {
        this.$refs.update.showUpdate();
      } else if (value.key === "edit") {
        this.$refs.manage.showManage();
      }
    },
    websocket_get_redis_info() {
      if (this.info_data_flags[this.redis_id] === undefined) {
        this.sendWebsocketMsg({
          type: 1,
          ip: this.redis_id
        });
        this.info_data_flags[this.redis_id] = true;
      }
    },
    async change_redis(val) {
      this.setRedisIDName({ redis_id: val });
      if (this.memu_key === "redis_monitor") {
        this.websocket_get_redis_info();
        this.$refs.charts.resetCharts();
      } else if (this.memu_key === "redis_info") {
        // this.$refs.infos.get_redis_infos();
      } else if (this.memu_key === "redis_data") {
        // await this.$refs.data.get_info();
        // await this.$refs.data.search_keys();
      }
    },
    show_command() {
      this.$refs.commandline.showCommand();
    }
  },
  async created() {
    this.initWS();
    await this.initContainers();
    // 定时更新redis服务器状态
    setInterval(this.updateContainerStatus, 30000)
    this.menuClick({ key: "redis_info" });
    try {
      document.body.removeChild(document.getElementById("spinner"));
    } catch (e) {
      //
    }
  },
  mounted() {}
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
  right: 20px;
  bottom: 20px;
  background: white;
}
.command-botton:hover,
.command-botton:focus {
  border-color: #fff;
}

.redis-output-container {
  overflow: auto;
  padding: 8px 24px;
  height: 91vh;
}
</style>
