<template>
    <div>
        <a-row style="padding-top: 10px">
            <a-col :span="16" style="padding-right: 10px">
                <div class="redis-output-container">
                    <a-list bordered :dataSource="redis_output[redis_ip]" >
                        <div slot="header">
                            <b>Redis输出信息:</b>
                            <div style="width: 100%; text-align: right">
                                <a-tag color="red" @click="delete_pubsub_output(-1)">清空信息</a-tag>
                            </div>
                        </div>
                        <a-list-item slot="renderItem" slot-scope="item, index">
                            <a-list-item-meta :description="item[1]" >
                                <a slot="title">接收通道: {{item[0]}}</a>
                            </a-list-item-meta>
                            <div slot="actions">
                                <a-button type="link" @click="format_json(item[1])">JSON</a-button>
                                <a-button shape="circle" type="danger" icon="delete" @click="delete_pubsub_output(index)"></a-button>
                            </div>
                        </a-list-item>
                    </a-list>
                </div>
            </a-col>
            <a-col :span="8" style="padding-top: 8px">
                <a-input v-model="pubsub_key" style="margin-bottom: 8px" placeholder="发布/订阅的Channel" />
                <a-textarea v-model="pubsub_msg" :rows="10" style="margin-bottom: 8px" :placeholder="pubsub_msg_placeholder" />
                <a-button type="primary" @click="publish_msg" style="background: #108ee9; border-color: #108ee9">发布</a-button>
                <a-button type="primary" @click="subscribe_msg" style="background: #87d068; border-color: #87d068; margin-left: 5px">订阅</a-button>

                <a-divider>发布列表</a-divider>
                <div style="line-height: 2; max-height: 22vh; overflow: auto">
                    <template v-for="tag in publish_keys[redis_ip]">
                        <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
                            <a-tag color="#108ee9" :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">
                                {{`${tag.slice(0, 80)}...`}}
                            </a-tag>
                        </a-tooltip>
                        <a-tag color="#108ee9" v-else :key="tag" @click="copyPublishMsg(tag)" :closable="true" :afterClose="() => handlePubClose(tag)">
                            {{tag}}
                        </a-tag>&nbsp;&nbsp;
                    </template>
                </div>
                <a-divider>订阅列表</a-divider>
                <div style="line-height: 2; max-height: 22vh; overflow: auto">
                    <template v-for="tag in subscribe_keys_show">
                        <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
                            <a-tag color="#87d068" :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
                                {{`${tag.slice(0, 80)}...`}}
                            </a-tag>
                        </a-tooltip>
                        <a-tag color="#87d068" v-else :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagClose(tag)">
                            {{tag}}
                        </a-tag>
                    </template>
                    <template v-for="tag in subscribe_keys_history_show">
                        <a-tooltip v-if="tag.length > 80" :key="tag" :title="tag">
                            <a-tag color="darkgrey" :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagHisClose(tag)">
                                {{`${tag.slice(0, 80)}...`}}
                            </a-tag>
                        </a-tooltip>
                        <a-tag color="darkgrey" v-else :key="tag" @click="()=>{pubsub_key = tag}" :closable="true" :afterClose="() => handleTagHisClose(tag)">
                            {{tag}}
                        </a-tag>
                    </template>
                </div>
            </a-col>
        </a-row>
        <a-modal v-model="showJson" :footer="null" :destroyOnClose="true" width="50vw">
            <json-view :data="jsonData" style="margin-top: 20px; overflow: auto; max-height: 72vh"/>
        </a-modal>
    </div>
</template>

<script>
    import jsonView from 'vue-json-views'
    import config from '../config'
    import utils from '../utils'
    import {mapState, mapMutations} from 'vuex'
    export default {
        name: "PubSub",
        data() {
            return {
                subscribe_keys_flag: {},
                publish_keys: {},
                pubsub_key: '',
                pubsub_msg: '',
                pubsub_msg_placeholder: '需要发布的信息, 可以直接放上可读的Json, 例如:\n{\n  "ABC": [\n    "123456",\n    "234567",\n    "345678",\n  ],\n  "DEF": ["567890"]\n}',
                jsonData: "",
                showJson: false,
            }
        },
        components: { jsonView },
        computed: {
            ...mapState(['redis_ip', 'subscribe_keys', 'subscribe_keys_history', 'redis_output']),
            subscribe_keys_show: function () {
                if (this.subscribe_keys[this.redis_ip] === undefined) return []
                return this.subscribe_keys[this.redis_ip]
            },
            subscribe_keys_history_show: function () {
                if (this.subscribe_keys_history[this.redis_ip] === undefined) return []
                return this.subscribe_keys_history[this.redis_ip]
            }
        },
        methods: {
            ...mapMutations(['send_websocket_msg', 'set_pubsub_keys', 'remove_pubsub_output']),
            format_json(json_data) {
                let jsonData = utils.parse_json(json_data)
                if (jsonData !== null) {
                    this.jsonData = jsonData
                    this.showJson = true
                } else {
                    this.$message.error('不支持该类型数据的JSON展示')
                }
            },
            delete_pubsub_output(index) {
                if (index === -1) {
                    this.remove_pubsub_output({'remove_all': true})
                } else {
                    this.remove_pubsub_output({'index': index})
                }
            },
            publish_msg() {
                if (this.redis_ip == "") {
                    this.$message.error('未检测到有效的Redis连接, 请在设置中添加', 10)
                    return
                }
                if (this.pubsub_key == "") {
                    this.$message.error('请输入Channel再试')
                    return
                }
                config.myaxios.get(`containers?method=publish&ip=${this.redis_ip}&key=${encodeURIComponent(this.pubsub_key)}&msg=${encodeURIComponent(this.pubsub_msg)}`)
                    .then(result => {
                        let res = result.data
                        if (res.code != 0) {
                            this.$message.error(res.msg)
                        } else {
                            this.$message.success(`${this.redis_ip} => ${res.msg} 发布成功`)
                            if (this.publish_keys[this.redis_ip] === undefined) {
                                this.$set(this.publish_keys, this.redis_ip, [])
                            }
                            if (this.publish_keys[this.redis_ip].indexOf(res.msg + ' | ' + res.data) === -1) {
                                this.publish_keys[this.redis_ip].push(res.msg + ' | ' + res.data)
                                localStorage.setItem('publish_keys', JSON.stringify(this.publish_keys))
                            }
                        }
                    })
            },
            subscribe_msg() {
                if (this.redis_ip == "") {
                    this.$message.error('未检测到有效的Redis连接, 请在设置中添加并刷新页面', 10)
                    return
                }
                if (this.pubsub_key == "") {
                    this.$message.error('请输入Channel再试')
                    return
                }
                if (this.subscribe_keys_flag[this.redis_ip] === undefined) {
                    this.$set(this.subscribe_keys_flag, this.redis_ip, {})
                }
                if (this.subscribe_keys_flag[this.redis_ip][this.pubsub_key] === undefined) {
                    this.send_websocket_msg({
                        'type': 2, 'ip': this.redis_ip, 'channel': this.pubsub_key, 'command': 'open'
                    })
                    this.$set(this.subscribe_keys_flag[this.redis_ip], this.pubsub_key, true)
                } else {
                    this.$message.error(`${this.redis_ip} => 已经订阅 ${this.pubsub_key}, 无需重复订阅`)
                }
            },
            copyPublishMsg(val) {
                let key_val = val.split(' | ')
                this.pubsub_key = key_val[0]
                this.pubsub_msg = key_val[1]
            },
            handlePubClose(removedTag) {
                const tags = this.publish_keys[this.redis_ip].filter(tag => tag !== removedTag)
                this.$set(this.publish_keys, this.redis_ip, tags)
                localStorage.setItem('publish_keys', JSON.stringify(this.publish_keys))
            },
            handleTagClose(removedTag) {
                if (this.subscribe_keys_flag[this.redis_ip][removedTag]) {
                    this.send_websocket_msg({
                        'type': 2, 'ip': this.redis_ip, 'channel': removedTag, 'command': 'close'
                    })
                    delete this.subscribe_keys_flag[this.redis_ip][removedTag]
                }
            },
            handleTagHisClose(removedTag) {
                const tags = this.subscribe_keys_history[this.redis_ip].filter(tag => tag !== removedTag)
                this.set_pubsub_keys({'redis_ip': this.redis_ip, 'subscribe_keys_history': tags})
                // this.$set(this.subscribe_keys_history, this.redis_ip, tags)
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
                localStorage.setItem('subscribe_keys', JSON.stringify(save_subscribe_keys))
            }
        },
        mounted() {
            window.onbeforeunload = this.onDestroy
            let publish_keys = localStorage.getItem('publish_keys')
            if (publish_keys !== null) {
                this.publish_keys = JSON.parse(publish_keys)
            }

            let subscribe_keys = localStorage.getItem('subscribe_keys')
            if (subscribe_keys !== null) {
                this.set_pubsub_keys({'subscribe_keys_history': JSON.parse(subscribe_keys)})
                // this.subscribe_keys_history = JSON.parse(subscribe_keys)
            }
        }
    }
</script>

<style scoped>

</style>
