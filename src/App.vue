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
              <a-menu-item key="redis_data"><a-icon type="database" />数据信息</a-menu-item>
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
                    <a-menu-item key="update"><a-icon type="reload"/>
                      <a-badge v-if="update_flag" status="error">更新通知</a-badge>
                      <span v-else>更新通知</span>
                    </a-menu-item>
                    <a-menu-item key="edit"><a-icon type="edit"/>连接管理</a-menu-item>
                  </a-menu>
                </a-dropdown>
              </a-col>
            </a-row>
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content style="padding: 10px 50px; height: 92vh">
        <div v-show="memu_key=='redis_monitor'">
          <Charts ref="charts"></Charts>
        </div>
        <div v-show="memu_key=='redis_data'">
          <Data ref="data"></Data>
        </div>
        <div v-show="memu_key=='redis_info'">
          <Infos ref="infos"></Infos>
        </div>
        <div v-show="memu_key=='redis_pubsub'">
          <PubSub ref="pubsub"></PubSub>
        </div>
      </a-layout-content>
    </a-layout>
    <a-button shape="circle" icon="thunderbolt" size="large" @click="show_command" class="command-botton"/>

    <Update ref="update"></Update>
    <About ref="about"></About>
    <Manage ref="manage"></Manage>
    <CommandLine ref="commandline"></CommandLine>
  </div>
</template>

<script>

import {mapState, mapMutations, mapActions } from 'vuex'

import Infos from "./views/Infos"
import Data from "./views/Data"
import Charts from "./views/Charts"
import PubSub from "./views/PubSub"

import About from "./components/About"
import Update from "./components/Update"
import Manage from "./components/Manage";
import CommandLine from "./components/CommandLine";

export default {
  name: "app",
  components: {
    Infos, Data, Charts, PubSub,
    About, Update, Manage, CommandLine
  },
  data() {
    return {
      memu_key: '',
      info_data_flags: {},
    }
  },
  computed: {
    ...mapState(['redis_ip', 'update_flag', 'containers']),
  },
  methods: {
    ...mapMutations(['setRedisIPName', 'initWS', 'send_websocket_msg']),
    ...mapActions(['initContainers']),
    async menuClick(value) {
      this.memu_key = value.key
      if (this.redis_ip === '') {
        this.$message.error('未检测到有效的Redis连接, 请在右上角的设置中添加', 10);
        return
      }
      if (this.memu_key === 'redis_info') {
        this.$refs.infos.get_redis_infos()
      } else if (this.memu_key === 'redis_data') {
        await this.$refs.data.get_info()
        await this.$refs.data.search_keys()
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
        this.$refs.about.showAbout()
      } else if (value.key === 'update') {
        this.$refs.update.showUpdate()
      } else if (value.key === 'edit') {
        this.$refs.manage.showManage()
      }
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
      this.setRedisIPName({'redis_ip': val})
      if (this.memu_key === 'redis_monitor') {
        this.websocket_get_redis_info()
        this.$refs.charts.updateCharts()
      } else if (this.memu_key === 'redis_info') {
        this.$refs.infos.get_redis_infos()
      } else if (this.memu_key === 'redis_data') {
        this.$refs.data.get_info()
      }
    },
    show_command() {
      this.$refs.commandline.showCommand()
    },
  },
  async created() {
    this.initWS()
    await this.initContainers()
    this.menuClick({'key': 'redis_data'})
  },
  mounted() {
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

  .redis-output-container {
    overflow: auto;
    padding: 8px 24px;
    height: 92vh;
  }
</style>
