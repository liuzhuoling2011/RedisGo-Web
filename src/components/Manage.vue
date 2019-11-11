<template>
    <div>
        <a-drawer
                width=560
                placement="right"
                @close="()=>{visible = false}"
                :visible="visible"
        >
            <div slot="title" >Redis连接管理 <a-divider type="vertical" /> <a-button icon="plus" style="color: #42b983" @click="add_container">添加连接</a-button></div>
            <a-card>
                <a-card-grid class="gridcard100" v-for="(item, key) in containers" v-bind:key="key">
                    名称: <a-tag color="green">{{item.name}}</a-tag> <a-divider type="vertical" />
                    IP: <a-tag color="blue">{{item.ip}}</a-tag> <a-divider type="vertical" />
                    端口: {{item.port}} <a-divider type="vertical" />
                    DB: {{item.db}} <br/><br/>
                    密码: {{item.password}} <a-divider type="vertical" />
                    <a-button shape="circle" icon="edit" @click="edit_container(item)"/>
                    <a-button shape="circle" icon="delete" type="danger" @click="delete_container(item.ip)"/>
                </a-card-grid>
            </a-card>
        </a-drawer>
        <a-drawer
                :title="children_drawl_name"
                width=280
                @close="()=>{visible_children = false}"
                :visible="visible_children"
        >
            <a-input placeholder="连接IP" v-if="children_drawl_name=='修改连接'" size="large" v-model="container_tmp.ip" disabled>
                <a-icon slot="prefix" type="api" />
                <a-icon v-if="container_tmp.ip" slot="suffix" type="close-circle" @click="()=>{container_tmp.ip = ''}" />
            </a-input>
            <a-input placeholder="连接IP" v-else size="large" v-model="container_tmp.ip" @change="()=>{container_tmp.name = container_tmp.ip}">
                <a-icon slot="prefix" type="api" />
                <a-icon v-if="container_tmp.ip" slot="suffix" type="close-circle" @click="()=>{container_tmp.ip = ''}" />
            </a-input>
            <a-input placeholder="连接名称" size="large" v-model="container_tmp.name" style="margin-top: 10px">
                <a-icon slot="prefix" type="user" />
                <a-icon v-if="container_tmp.name" slot="suffix" type="close-circle" @click="()=>{container_tmp.name = ''}" />
            </a-input>
            <a-input placeholder="密码" size="large" v-model="container_tmp.password" style="margin-top: 10px">
                <a-icon slot="prefix" type="warning" />
                <a-icon v-if="container_tmp.password" slot="suffix" type="close-circle" @click="()=>{container_tmp.password = ''}" />
            </a-input>
            <a-input placeholder="端口" size="large" v-model="container_tmp.port" style="margin-top: 10px">
                <a-icon slot="prefix" type="appstore" />
                <a-icon v-if="container_tmp.port" slot="suffix" type="close-circle" @click="()=>{container_tmp.port = ''}" />
            </a-input>
            <a-input placeholder="DB" size="large" v-model="container_tmp.db" style="margin-top: 10px">
                <a-icon slot="prefix" type="hdd" />
                <a-icon v-if="container_tmp.db" slot="suffix" type="close-circle" @click="()=>{container_tmp.db = ''}" />
            </a-input>
            <a-button type="primary" style="margin-top: 10px" v-if="children_drawl_name=='修改连接'" @click="upload_edit" :loading="visible_children_loading">确认</a-button>
            <a-button type="primary" style="margin-top: 10px" v-else @click="upload_add" :loading="visible_children_loading">确认</a-button>
        </a-drawer>
    </div>
</template>

<script>
    import config from '../config'
    import {mapState, mapMutations} from 'vuex'
    export default {
        name: "Manage",
        data() {
            return {
                container_tmp: {ip:'', name:'', password:'', port:6379, db:0, status:0},
                visible: false,
                visible_children: false,
                visible_children_loading: false,
                children_drawl_name: '新增连接',
            }
        },
        computed: {
            ...mapState(['redis_ip', 'containers']),
        },
        methods: {
            ...mapMutations(['setRedisIPName', 'addContainer', 'deleteContainer']),
            showManage() {
                this.visible = true
            },
            add_container() {
                this.visible_children = true
                this.children_drawl_name = '新增连接'
                this.container_tmp.ip = ''
                this.container_tmp.password = ''
                this.container_tmp.name = ''
                this.container_tmp.port = 6379
                this.container_tmp.db = 0
            },
            edit_container(item) {
                this.visible_children = true
                this.children_drawl_name = '修改连接'
                this.container_tmp.ip = item.ip
                this.container_tmp.password = item.password
                this.container_tmp.name = item.name
                this.container_tmp.port = item.port
                this.container_tmp.db = item.db
            },
            delete_container(ip) {
                config.myaxios.get('containers?method=delete&ip=' + ip)
                    .then(result => {
                        let code = result.data.code;
                        if (code == 0) {
                            this.$message.success('成功删除Redis连接');
                            if (ip === this.redis_ip) {
                                let find = false
                                for (let c in this.containers) {
                                    if (this.containers[c].ip !== ip) {
                                        this.setRedisIPName({'redis_ip': this.containers[c].ip})
                                        find = true
                                        break
                                    }
                                }
                                if (!find) {
                                    this.$message.error('未检测到有效的Redis连接, 请在右上角的设置中添加', 10);
                                }
                            }
                            this.deleteContainer({'ip': ip})
                        }
                    })
            },
            upload_add() {
                this.visible_children_loading = true
                config.myaxios.get(`containers?method=add&ip=${this.container_tmp.ip}&name=${this.container_tmp.name}&password=${this.container_tmp.password}&port=${this.container_tmp.port}&db=${this.container_tmp.db}`)
                    .then(result => {
                        this.visible_children_loading = false
                        let res = result.data
                        if (res.code != 0) {
                            this.$message.error(res.msg)
                        } else {
                            this.addContainer({'ip': this.container_tmp.ip, 'container': res.data})
                            this.$message.success('添加成功')
                            this.visible_children = false
                            if (Object.keys(this.containers).length === 1) {
                                this.setRedisIPName({'redis_ip': this.container_tmp.ip, 'redis_name': this.container_tmp.name})
                                this.menuClick({key:'redis_info'})
                            }
                        }
                    })
            },
            upload_edit() {
                this.visible_children_loading = true
                config.myaxios.get(`containers?method=edit&ip=${this.container_tmp.ip}&name=${this.container_tmp.name}&password=${this.container_tmp.password}&port=${this.container_tmp.port}&db=${this.container_tmp.db}`)
                    .then(result => {
                        this.visible_children_loading = false
                        let res = result.data
                        if (res.code != 0) {
                            this.$message.error(res.msg)
                        } else {
                            this.add_container({'ip': this.container_tmp.ip, 'container': res.data})
                            this.$message.success('修改成功')
                            this.visible_children = false
                        }
                    })
            },
        }
    }
</script>

<style scoped>
    .gridcard100 {
        width: 100%;
        textAlign: 'left';
    }
</style>
