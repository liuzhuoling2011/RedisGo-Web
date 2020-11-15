import Vue from "vue"
import Vuex from "vuex"
import moment from "moment"
import C from "@/config"
import U from "@/utils"

Vue.use(Vuex)

function process_info_data(redata, state) {
  const id = redata.msg
  const data = JSON.parse(redata.data)
  state.info_data = data

  if (state.chart_data[id] === undefined) {
    state.chart_data[id] = [
      [
        "time",
        "instantaneous_input_kbps",
        "instantaneous_output_kbps",
        "used_memory",
        "instantaneous_ops_per_sec",
        "used_cpu_user"
      ]
    ]
  }

  let line_data = [
    moment().format("HH:mm:ss"),
    data["instantaneous_input_kbps"],
    data["instantaneous_output_kbps"],
    data["used_memory"] / 1024,
    data["instantaneous_ops_per_sec"],
    data["used_cpu_user"]
  ]
  state.chart_data[id] = U.circle_push(state.chart_data[id], line_data)

  if (state.redis_id === id) {
    state.chart_id_data = line_data
    state.chart_change_count += 1 // id相同的数据才会刷新图表
  }
}

function remove_his_subscribe_keys(state, key) {
  const tags = state.subscribe_keys_history[state.redis_id].filter(
      tag => tag !== key
  )
  Vue.set(state.subscribe_keys_history, state.redis_id, tags)
}

function receiveData(e, state) {
  const redata = JSON.parse(e.data)
  if (redata.type === 0) return
  if (redata.type === 1) {
    process_info_data(redata, state)
  } else if (redata.type === 2) {
    if (redata.status === 0) {
      Vue.prototype.$message.success(`${state.redis_id} => ${redata.msg} 订阅成功`)
      if (state.subscribe_keys[state.redis_id] === undefined) {
        Vue.set(state.subscribe_keys, state.redis_id, [])
      }
      if (state.subscribe_keys[state.redis_id].indexOf(redata.msg) === -1) {
        state.subscribe_keys[state.redis_id].push(redata.msg)
      }
      remove_his_subscribe_keys(state, redata.msg)
      return
    } else if (redata.status === -1) {
      let redis_id = redata.msg
      Vue.prototype.$message.success(`${redis_id} => ${redata.data} 取消订阅成功`)
      const tags = state.subscribe_keys[redis_id].filter(
          tag => tag !== redata.data
      )
      Vue.set(state.subscribe_keys, redis_id, tags)
      return
    }
    Vue.set(
        state.redis_output,
        state.redis_id,
        U.circle_push(state.redis_output[state.redis_id], [
          redata.msg,
          redata.data
        ])
    )
  }
}

export default new Vuex.Store({
  state: {
    redis_id: "",
    redis_name: "",
    websocket: null,
    websocket_ping: null,

    containers: {},

    info_data_map: {},

    update_flag: false,

    chart_data: {},
    chart_id_data: [],
    chart_change_count: 0,

    subscribe_keys: {},
    subscribe_keys_history: {},
    redis_output: {}
  },
  getters: {
    info_data (state) {
      return state.info_data_map[state.redis_id]
    }
  },
  mutations: {
    setUserInfo(state, payload) {
      state.login = payload.login
      state.user = payload.user
    },
    setRedisIDName(state, payload) {
      state.redis_id = payload.redis_id
      if (payload.redis_name !== undefined) {
        state.redis_name = payload.redis_name
      }
    },
    setContainers(state, payload) {
      state.containers = payload.containers
    },
    setContainer(state, payload) {
      Vue.set(state.containers, payload.id, payload.container)
    },
    deleteContainer(state, payload) {
      Vue.delete(state.containers, payload.id)
      state.redis_id = ""
      state.redis_name = ""
      for (let c in state.containers) {
        state.redis_id = state.containers[c].id
        state.redis_name = state.containers[c].name
        break
      }
    },
    setRedisInfo(state, payload) {
      Vue.set(state.info_data_map, state.redis_id, payload.info_data)
    },
    setUpdateFlag(state) {
      state.update_flag = true
    },
    setPubsubKeys(state, payload) {
      if (payload.redis_id !== undefined) {
        if (payload.subscribe_keys !== undefined) {
          Vue.set(
            state.subscribe_keys,
            payload.redis_id,
            payload.subscribe_keys
          )
        }
        if (payload.subscribe_keys_history !== undefined) {
          Vue.set(
            state.subscribe_keys_history,
            payload.redis_id,
            payload.subscribe_keys_history
          )
        }
      } else {
        if (payload.subscribe_keys !== undefined) {
          for (let id in payload.subscribe_keys) {
            Vue.set(state.subscribe_keys, id, payload.subscribe_keys[id])
          }
        }
        if (payload.subscribe_keys_history !== undefined) {
          for (let id in payload.subscribe_keys_history) {
            Vue.set(
              state.subscribe_keys_history,
              id,
              payload.subscribe_keys_history[id]
            )
          }
        }
      }
    },
    removePubsubOutput(state, payload) {
      if (payload.remove_all) {
        Vue.set(state.redis_output, state.redis_id, [])
      } else {
        Vue.delete(state.redis_output[state.redis_id], payload.index)
      }
    },
    sendWebsocketMsg(state, json_data = { type: 0 }) {
      // type为0的时候是发心跳信号
      state.websocket.send(JSON.stringify(json_data))
    },
    initWS(state) {
      let websocket = new WebSocket(C.ws_url)
      websocket.onopen = () => {
        U.log("WebSocket连接成功")
        // 60秒一次的心跳信号, 防止websocket自动断开
        state.websocket_ping = setInterval(state.sendWebsocketMsg, 60000)
      }
      websocket.onerror = () => Vue.prototype.$message.error("WebSocket连接发生错误, 请刷新页面")
      websocket.onclose = e => {
        U.log(`WebSocket连接关闭 (${e.data})`)
        state.websocket = null
        clearTimeout(state.websocket_ping)
        state.websocket_ping = null
        Vue.prototype.$notification["error"]({
          message: "WebSocket连接断开, 请按Ctrl+F5刷新页面",
          duration: 0
        })
      }
      websocket.onmessage = e => receiveData(e, state)
      state.websocket = websocket
    }
  },
  actions: {
    async initContainers({ commit }) {
      let redis_id = ""
      let body = await C.myaxios.get("containers?method=check")
      if (body.status === 200 && body.data && body.data.code === 0) {
        let data = body.data.data
        for (let c in data) {
          if (redis_id === "") {
            redis_id = data[c]["ip"] + ":" + data[c]["port"]
            commit("setRedisIDName", {
              redis_id: redis_id,
              redis_name: data[c]["name"]
            })
          }
        }
        if (redis_id !== "") {
          commit("setContainers", { containers: data })
        }
      }
    },
    async updateContainerStatus({ commit }) {
      let body = await C.myaxios.get("containers?method=check")
      if (body.status === 200 && body.data && body.data.code === 0) {
        commit("setContainers", { containers: body.data.data })
      }
    },
  }
})
