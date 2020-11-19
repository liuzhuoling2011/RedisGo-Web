<template>
  <div>
    <a-modal v-model="about_flag" width="420px" :footer="null">
      <div slot="title"><a-icon type="check-circle" style="color: lightgreen; font-size: 22px"/> {{version}}</div>
      <div style="text-align: center">
        <img style="width: 50%" :src="pic_src"/>
        <p>您正在使用免费开源的 <a-tag color="green">RedisGo</a-tag></p>
        <p>可以扫码关注 <a-tag color="red">公众号</a-tag>获得最新的消息</p>
        <p>如果觉得好用，不妨在  <a target="_blank" href="https://github.com/liuzhuoling2011/RedisGo"> <a-icon type="github" />Github</a> 给个 <a-icon type="star" theme="filled" style="color: sandybrown" /></p>
        <p>良好的关注度和参与度有助于开源项目的长远发展~</p>
      </div>
    </a-modal>
  </div>
</template>

<script>
export default {
  name: 'About',
  data() {
    return {
      version: 'RedisGo Web V2.0.4',
      about_flag: false,
      pic_src: 'http://qiniu.zoranjojo.top/zoranjojo.jpg'
    }
  },
  methods: {
    showAbout(){
      this.about_flag = true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
