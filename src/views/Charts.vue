<template>
    <div>
        <a-row>
            <a-col :span="12">
                <div id="chart" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
                <div id="chart1" style="height:46vh; width:48vw"></div>
            </a-col>
        </a-row>
        <a-row>
            <a-col :span="12">
                <div id="chart2" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
                <div id="chart3" style="height:46vh; width:48vw"></div>
            </a-col>
        </a-row>
    </div>
</template>

<script>
    import echarts from 'echarts'
    import {mapState, mapMutations} from 'vuex'

    let option = {
        title: {
            text: '流量监控'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                animation: false
            }
        },
        axisPointer: {
            link: {xAxisIndex: 'all'}
        },
        grid: [{
            left: 50,
            right: 50,
            height: '32%'
        }, {
            left: 50,
            right: 50,
            top: '60%',
            height: '32%'
        }],
        xAxis: [
            {
                type: 'category',
                axisLine: {onZero: true},
            },
            {
                gridIndex: 1,
                type: 'category',
                axisLine: {onZero: true},
                position: 'top'
            }
        ],
        yAxis: [
            {
                name: '上行流量(Kbps/s)',
                type: 'value',
            },
            {
                gridIndex: 1,
                name: '下行流量(Kbps/s)',
                type: 'value',
                inverse: true
            }
        ],
        series: [
            {
                name: '上行流量',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                data: []
            },
            {
                name: '下行流量',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                showSymbol: false,
                sampling: 'average',
                hoverAnimation: false,
                data: []
            }
        ]
    }
    let option1 = {
        title: {
            text: '内存监控'
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
        },
        yAxis: {
            name: '内存占用(KB)',
            type: 'value'
        },
        grid: {
            left: 0,
            right: 0,
            bottom: 0,
            containLabel: true
        },
        series: [{
            data: [],
            type: 'line',
            hoverAnimation: false,
            showSymbol: false,
            sampling: 'average'
        }]
    }
    let option2 = {
        title: {
            text: '每秒执行操作数'
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            // data: []
        },
        yAxis: {
            type: 'value'
        },
        grid: {
            left: 20,
            right: 20,
            containLabel: true
        },
        series: [{
            data: [],
            type: 'line',
            hoverAnimation: false,
            showSymbol: false,
            sampling: 'average'
        }]
    }
    let option3 = {
        title: {
            text: 'CPU监控'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                animation: false
            }
        },
        xAxis: {
            type: 'category',
            // data: []
        },
        yAxis: {
            type: 'value'
        },
        grid: {
            left: 20,
            right: 20,
            containLabel: true
        },
        series: [{
            data: [],
            type: 'line',
            hoverAnimation: false,
            showSymbol: false,
            sampling: 'average'
        }]
    }

    let myChart = null
    let myChart1 = null
    let myChart2 = null
    let myChart3 = null

    export default {
        name: 'RedisCharts',
        data() {
            return {
                // eslint-disable-next-line no-console
                log: console.log,
            }
        },
        computed: {
            ...mapState(['redis_ip', 'chart_data', 'chart_info_data', 'chart_change_count']),
        },
        watch: {
            chart_change_count() {
                this.updateCharts()
            },
        },
        methods: {
            ...mapMutations(['initWS']),
            resetCharts() {
                myChart.setOption(option)
                myChart2.setOption(option2)
                myChart3.setOption(option3)
                let time_data = this.chart_data.time_data[this.redis_ip]
                let info_input_kbps = this.chart_data.info_input_kbps[this.redis_ip]
                let info_output_kbps = this.chart_data.info_output_kbps[this.redis_ip]
                let info_used_memory = this.chart_data.info_used_memory[this.redis_ip]
                let info_ops_per_sec = this.chart_data.info_ops_per_sec[this.redis_ip]
                let info_used_cpu_user = this.chart_data.info_used_cpu_user[this.redis_ip]

                let chart_data = [[], []]
                let chart_data1 = []
                let chart_data2 = []
                let chart_data3 = []
                if (time_data !== undefined) {
                    for (let i = 0; i < time_data.length; i++) {
                        chart_data[0].push([time_data[i], info_input_kbps[i]])
                        chart_data[1].push([time_data[i], info_output_kbps[i]])
                        chart_data1.push([time_data[i], info_used_memory[i]])
                        chart_data2.push([time_data[i], info_ops_per_sec[i]])
                        chart_data3.push([time_data[i], info_used_cpu_user[i]])
                    }
                }

                option.series[0].data = chart_data[0]
                option.series[1].data = chart_data[1]
                myChart.setOption(option)

                option1.series[0].data = chart_data1
                myChart1.setOption(option1)

                option2.series[0].data = chart_data2
                myChart2.setOption(option2)

                option3.series[0].data = chart_data3
                myChart3.setOption(option3)
            },
            updateCharts() {
                let cur_time = this.chart_info_data.time
                myChart.appendData({seriesIndex: 0, data: [[cur_time, this.chart_info_data.info_input_kbps]]})
                myChart.appendData({seriesIndex: 1, data: [[cur_time, this.chart_info_data.info_output_kbps]]})
                myChart.resize()

                myChart1.appendData({seriesIndex: 0, data: [[cur_time, this.chart_info_data.info_used_memory]]})
                myChart1.resize()

                myChart2.appendData({seriesIndex: 0, data: [[cur_time, this.chart_info_data.info_ops_per_sec]]})
                myChart2.resize()

                myChart3.appendData({seriesIndex: 0, data: [[cur_time, this.chart_info_data.info_used_cpu_user]]})
                myChart3.resize()
                this.log(cur_time)
            }
        },
        mounted() {
            myChart = echarts.init(document.getElementById('chart'))
            myChart.setOption(option)
            myChart1 = echarts.init(document.getElementById('chart1'))
            myChart1.setOption(option1)
            myChart2 = echarts.init(document.getElementById('chart2'))
            myChart2.setOption(option2)
            myChart3 = echarts.init(document.getElementById('chart3'))
            myChart3.setOption(option3)
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
