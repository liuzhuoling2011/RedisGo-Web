<template>
    <div>
        <a-drawer
                height=500
                placement="bottom"
                @close="()=>{command_visible = false}"
                :visible="command_visible"
        >
            <div slot="title" >Redis终端 (请不要执行带阻塞性质的命令 例如: BLPOP, SUBSCRIBE)</div>
            <a-textarea id="redis_command_output" v-model="redis_command_output" placeholder="Redis命令输出" :rows="16" style="background: silver;word-break: break-all;"/>
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
            execute_command() {
                config.myaxios.get(`containers?method=execute&ip=${this.redis_ip}&command=${this.redis_command}`)
                    .then(result => {
                        let code = result.data.code;
                        if (code == 0) {
                            let output = result.data.data
                            if (Array.isArray(output)) {
                                output = output.join(', ')
                            }
                            this.redis_command_output += `${moment().format('YYYY-MM-DD HH:mm:ss')}\t${output}\n`
                            const textarea = document.getElementById('redis_command_output');
                            textarea.scrollTop = textarea.scrollHeight;
                        }
                    })
            },

        }
    }
</script>

<style scoped>

</style>
