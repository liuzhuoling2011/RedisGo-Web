<template>
    <div>
        <div style="text-align: center; width: 100%">
            <div id="chart" style="height:90vh; width:96vw"></div>
        </div>
    </div>
</template>

<script>
    import echarts from 'echarts'
    import {mapState, mapMutations} from 'vuex'

    const option =  {
        legend: {},
        animationThreshold: 5 * 60,
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                animation: false
            }
        },
        dataset: {
            dimensions: [
                'time', 'instantaneous_input_kbps', 'instantaneous_output_kbps',
                'used_memory', 'instantaneous_ops_per_sec', 'used_cpu_user'
            ],
            source: []
        },
        grid: [
            {x: '7%', y: '7%', width: '40%', height: '19%'},
            {x: '7%', y2: '52%', width: '40%', height: '19%'},
            {x2: '7%', y: '7%', width: '40%', height: '40%'},
            {x: '7%', y2: '7%', width: '40%', height: '40%'},
            {x2: '7%', y2: '7%', width: '40%', height: '40%'}
        ],
        axisPointer: {
            link: {xAxisIndex: 'all'}
        },
        xAxis: [
            {gridIndex: 0, type: 'category'},
            {gridIndex: 1, type: 'category', position: 'top', show: false},
            {gridIndex: 2, type: 'category'},
            {gridIndex: 3, type: 'category'},
            {gridIndex: 4, type: 'category'}
        ],
        yAxis: [
            {gridIndex: 0, nameGap: 55, nameLocation: 'center', name: '上行流量(Kbps/s)'},
            {gridIndex: 1, nameGap: 55, nameLocation: 'center', name: '下行流量(Kbps/s)', inverse: true},
            {gridIndex: 2, nameGap: 55, nameLocation: 'center', name: '内存监控'},
            {gridIndex: 3, nameGap: 55, nameLocation: 'center', name: '每秒执行操作数)'},
            {gridIndex: 4, nameGap: 55, nameLocation: 'center', name: 'CPU监控'}
        ],
        series: [
            {
                name: '上行流量',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                name: '下行流量',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                xAxisIndex: 1,
                yAxisIndex: 1
            },
            {
                name: '内存监控',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                xAxisIndex: 2,
                yAxisIndex: 2,
            },
            {
                name: '每秒执行操作数',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                xAxisIndex: 3,
                yAxisIndex: 3,
            },
            {
                name: 'CPU监控',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                sampling: 'average',
                xAxisIndex: 4,
                yAxisIndex: 4,
            }

        ]
    }

    let myChart = null

    export default {
        name: 'RedisCharts',
        data() {
            return {
                // eslint-disable-next-line no-console
                log: console.log,
                last_time: {}
            }
        },
        computed: {
            ...mapState(['redis_id', 'chart_data', 'chart_id_data', 'chart_change_count']),
        },
        watch: {
            chart_change_count() {
                this.updateCharts()
            },
        },
        methods: {
            ...mapMutations(['initWS']),
            resetCharts() {
                option.dataset.source = this.chart_data[this.redis_ip]
                if (option.dataset.source === undefined) {
                    option.dataset.source = []
                }
                myChart.setOption(option)
            },
            updateCharts() {
                if (this.last_time[this.redis_ip] === undefined) {
                    this.last_time[this.redis_ip] = this.chart_id_data[0]
                    option.dataset.source = this.chart_data[this.redis_ip]
                } else if (this.last_time[this.redis_ip] !== this.chart_id_data[0]) {
                    // 貌似是引用的, 这里无需在push
                    // option.dataset.source = U.circle_push(option.dataset.source, this.chart_id_data)
                    myChart.setOption(option)
                    this.log(this.chart_id_data[0])
                }
            }
        },
        mounted() {
            myChart = echarts.init(document.getElementById('chart'))
            myChart.setOption(option)
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
