<template>
    <div>
        <a-modal v-model="show_update" :footer="null">
            <div v-if="update_flag" slot="title"><a-icon type="info-circle" style="color: orange; font-size: 22px"/> 可以升级的版本如下, 下载后请替换本程序</div>
            <div v-else slot="title"><a-icon type="check-circle" style="color: lightgreen; font-size: 22px"/> 您目前使用的版本是最新的, 无需更新!</div>
            <a-list itemLayout="horizontal" :dataSource="update_version">
                <a-list-item slot="renderItem" slot-scope="item">
                    <a-list-item-meta>
                        <a slot="title" :href="item">{{item}}</a>
                    </a-list-item-meta>
                </a-list-item>
            </a-list>
        </a-modal>
    </div>
</template>

<script>
    import config from '../config'
    import {mapState, mapMutations} from 'vuex'
    export default {
        name: 'Update',
        data() {
            return {
                update_version: [],
                show_update: false,
            }
        },
        computed: {
            ...mapState(['update_flag']),
        },
        methods: {
            ...mapMutations(['setUpdateFlag']),
            showUpdate() {
              this.show_update = true
            },
            checkUpdate(){
                config.myaxios.get('system?method=update')
                  .then(result => {
                    this.update_version = JSON.parse(result.data.data).data.filename
                    if (this.update_version === null || this.update_version.length === 1){
                      this.update_version = []
                    } else {
                      this.setUpdateFlag()
                      this.update_version.shift()
                      for (let i = 0; i < this.update_version.length; i++) {
                        this.update_version[i] = `http://${this.update_version[i]}`
                      }
                      this.update_version.reverse()
                    }
                  })
                config.myaxios.get('system?method=notice')
                  .then(result => {
                    let storage_key = 'redisgo_notice_time'
                    this.notices = JSON.parse(result.data.data).data
                    for (let i = 0; i < this.notices.length; i++) {
                      if (localStorage[storage_key] == null || localStorage[storage_key] < this.notices[i].CreatedAt) {
                        localStorage.setItem(storage_key, this.notices[i].CreatedAt);
                        this.$notification['success']({
                          top: 80,
                          duration: 10,
                          message: "温馨提示",
                          description: this.notices[i].Msg,
                        })
                      }
                    }
                  })
            }
        },
        mounted() {
            this.checkUpdate()
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
