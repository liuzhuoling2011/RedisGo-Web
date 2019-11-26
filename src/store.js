import Vue from 'vue'
import Vuex from 'vuex'
import moment from 'moment'
import config from './config'
import utils from './utils'

Vue.use(Vuex)

function process_info_data(redata, state) {
    const ip = redata.msg
    const data = JSON.parse(redata.data)
    state.info_data_map[ip] = data
    state.info_data = data
    state.chart_data.time_data[ip] = utils.circle_push(state.chart_data.time_data[ip], moment().format('HH:mm:ss'))
    state.chart_data.info_input_kbps[ip] = utils.circle_push(state.chart_data.info_input_kbps[ip], data['instantaneous_input_kbps'])
    state.chart_data.info_output_kbps[ip] = utils.circle_push(state.chart_data.info_output_kbps[ip], data['instantaneous_output_kbps'])
    state.chart_data.info_used_memory[ip] = utils.circle_push(state.chart_data.info_used_memory[ip], data['used_memory'] / 1024)
    state.chart_data.info_ops_per_sec[ip] = utils.circle_push(state.chart_data.info_ops_per_sec[ip], data['instantaneous_ops_per_sec'])
    state.chart_data.info_used_cpu_user[ip] = utils.circle_push(state.chart_data.info_used_cpu_user[ip], data['used_cpu_user'])
    state.chart_change_count += 1
}

function remove_his_subscribe_keys(state, key) {
    const tags = state.subscribe_keys_history[state.redis_ip].filter(tag => tag !== key)
    Vue.set(state.subscribe_keys_history, state.redis_ip, tags)
}

function receiveData(e, state) {
    const redata = JSON.parse(e.data);
    if (redata.type == 0) return
    if (redata.type == 1) {
        process_info_data(redata, state)
    } else if (redata.type == 2) {
        if (redata.status == 0) {
            Vue.prototype.$message.success(`${state.redis_ip} => ${redata.msg} 订阅成功`)
            if (state.subscribe_keys[state.redis_ip] === undefined) {
                Vue.set(state.subscribe_keys, state.redis_ip, [])
            }
            if (state.subscribe_keys[state.redis_ip].indexOf(redata.msg) === -1) {
                state.subscribe_keys[state.redis_ip].push(redata.msg)
            }
            remove_his_subscribe_keys(state, redata.msg)
            return
        } else if (redata.status == -1) {
            let redis_ip = redata.msg
            Vue.prototype.$message.success(`${redis_ip} => ${redata.data} 取消订阅成功`)
            const tags = state.subscribe_keys[redis_ip].filter(tag => tag !== redata.data)
            Vue.set(state.subscribe_keys, redis_ip, tags)
            return
        }
        Vue.set(state.redis_output, state.redis_ip, utils.circle_push(state.redis_output[state.redis_ip], [redata.msg, redata.data]))
    }
}

export default new Vuex.Store({
    state: {
        // eslint-disable-next-line no-console
        log: console.log,
        redis_ip: '',
        redis_name: '',
        websocket: null,
        websocket_ping: null,

        containers: {},

        info_data: {},
        info_data_map: {},

        update_flag: false,

        chart_data: {
            time_data: {},
            info_input_kbps: {},
            info_output_kbps: {},
            info_used_memory: {},
            info_ops_per_sec: {},
            info_used_cpu_user: {},
        },
        chart_change_count: 0,

        subscribe_keys: {},
        subscribe_keys_history: {},
        redis_output: {}
    },
    mutations: {
        setUserInfo(state, payload) {
            state.login = payload.login
            state.user = payload.user
        },
        setRedisIPName(state, payload) {
            state.redis_ip = payload.redis_ip
            if (payload.redis_name !== undefined) {
                state.redis_name = payload.redis_name
            }
        },
        setContainers(state, payload) {
            state.containers = payload.containers
        },
        addContainer(state, payload) {
            Vue.set(state.containers, payload.ip, payload.container)
        },
        deleteContainer(state, payload) {
            Vue.delete(state.containers, payload.ip)
        },
        setRedisInfo(state, payload) {
            state.info_data = payload.info_data
            state.info_data_map[state.redis_ip] = payload.info_data
        },
        setUpdateFlag(state) {
            state.update_flag = true
        },
        set_pubsub_keys(state, payload) {
            if (payload.redis_ip !== undefined) {
                if (payload.subscribe_keys !== undefined) {
                    Vue.set(state.subscribe_keys, payload.redis_ip, payload.subscribe_keys)
                }
                if (payload.subscribe_keys_history !== undefined) {
                    Vue.set(state.subscribe_keys_history, payload.redis_ip, payload.subscribe_keys_history)
                }
            } else {
                if (payload.subscribe_keys !== undefined) {
                    for (let ip in payload.subscribe_keys) {
                        Vue.set(state.subscribe_keys, ip, payload.subscribe_keys[ip])
                    }
                }
                if (payload.subscribe_keys_history !== undefined) {
                    for (let ip in payload.subscribe_keys_history) {
                        Vue.set(state.subscribe_keys_history, ip, payload.subscribe_keys_history[ip])
                    }
                }
            }
        },
        remove_pubsub_output(state, payload) {
            if (payload.remove_all) {
                Vue.set(state.redis_output, state.redis_ip, [])
            } else {
                Vue.delete(state.redis_output[state.redis_ip], payload.index)
            }
        },
        send_websocket_msg(state, json_data={'type': 0}) {  // type为0的时候是发心跳信号
            state.websocket.send(JSON.stringify(json_data));
        },
        initWS(state) {
            let websocket = new WebSocket(config.ws_url)
            websocket.onopen = () => {
                state.log("WebSocket连接成功")
                // 60秒一次的心跳信号, 防止websocket自动断开
                state.websocket_ping = setInterval(state.send_websocket_msg, 60000)
            }
            websocket.onerror = () => Vue.prototype.$message.error('WebSocket连接发生错误, 请刷新页面')
            websocket.onclose = (e) => {
                state.log(`WebSocket连接关闭 (${e.data})`)
                state.websocket = null
                clearTimeout(state.websocket_ping)
                state.websocket_ping = null
            }
            websocket.onmessage = (e) => receiveData(e, state)
            state.websocket = websocket
        }
    },
    actions: {
        async initContainers({ commit }) {
            let redis_ip = ''
            const body = await config.myaxios.get("containers?method=list")
            if (body.status === 200 && body.data && body.data.code === 0) {
                let data = body.data.data;
                for (let c in data) {
                    if (redis_ip === "") {
                        redis_ip = data[c]["ip"]
                        commit('setRedisIPName', { 'redis_ip': redis_ip, 'redis_name': data[c]["name"] })
                    }
                }
                if (redis_ip !== "") {
                    commit('setContainers', {'containers': data})
                }
            }
        }
    }
})
