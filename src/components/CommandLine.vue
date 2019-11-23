<template>
    <div>
        <a-drawer
                height=500
                placement="bottom"
                @close="()=>{command_visible = false}"
                :visible="command_visible"
        >
            <div slot="title" >Redis终端 (请不要执行带阻塞性质的命令 例如: BLPOP, SUBSCRIBE)</div>
<!--            <a-textarea id="redis_command_output" v-model="redis_command_output" placeholder="Redis命令输出" :rows="16" style="background: silver;word-break: break-all;"/>-->
            <pre id="redis_command_output" style="height: 350px;white-space: pre-wrap; word-wrap: break-word;">{{redis_command_output}}</pre>
            <a-input-search v-model="redis_command" placeholder="请输入执行的命令" style="margin-top: 10px" @search="execute_command">
                <a-button slot="enterButton" type="primary">执行</a-button>
            </a-input-search>
        </a-drawer>
    </div>
</template>

<script>
    import moment from 'moment'
    import config from '../config'
    import {mapState} from 'vuex'
    export default {
        name: "CommandLine",
        data() {
            return {
                redis_command: '',
                redis_command_output: '',
                command_visible: false,
            }
        },
        computed: {
            ...mapState(['redis_ip']),
        },
        methods: {
            showCommand() {
                this.command_visible = true
            },
            async execute_command() {
                const body = await config.myaxios.get(`containers?method=execute&ip=${this.redis_ip}&command=${this.redis_command}`)
                if (body.status === 200 && body.data && body.data.code === 0) {
                    let output = body.data.data
                    if (Array.isArray(output)) {
                        output = output.join(', ')
                    }
                    this.redis_command_output += `${moment().format('YYYY-MM-DD HH:mm:ss')}\t${output}\n`
                    setTimeout(()=>{
                        const textarea = document.getElementById('redis_command_output');
                        textarea.scrollTop = textarea.scrollHeight;
                    }, 100)
                }
            },
        }
    }
</script>

<style scoped>

</style>
