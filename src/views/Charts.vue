<template>
    <div>
        <a-row>
            <a-col :span="12">
                <div ref="chart" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
                <div ref="chart1" style="height:46vh; width:48vw"></div>
            </a-col>
        </a-row>
        <a-row>
            <a-col :span="12">
                <div ref="chart2" style="height:46vh; width:48vw"></div>
            </a-col>
            <a-col :span="12">
                <div ref="chart3" style="height:46vh; width:48vw"></div>
            </a-col>
        </a-row>
    </div>
</template>

<script>
    import echarts from 'echarts'
    import {mapState, mapMutations} from 'vuex'

    export default {
        name: 'RedisCharts',
        data() {
            return {
                myChart: null,
                myChart1: null,
                myChart2: null,
                myChart3: null,
                option: {
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
                            boundaryGap: false,
                            axisLine: {onZero: true},
                            data: []
                        },
                        {
                            gridIndex: 1,
                            type: 'category',
                            boundaryGap: false,
                            axisLine: {onZero: true},
                            data: [],
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
                            symbolSize: 8,
                            hoverAnimation: false,
                            data: []
                        },
                        {
                            name: '下行流量',
                            type: 'line',
                            xAxisIndex: 1,
                            yAxisIndex: 1,
                            symbolSize: 8,
                            hoverAnimation: false,
                            data: []
                        }
                    ]
                },
                option1: {
                    title: {
                        text: '内存监控'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: []
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
                        smooth: true
                    }]
                },
                option2: {
                    title: {
                        text: '每秒执行操作数'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: []
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
                        smooth: true
                    }]
                },
                option3: {
                    title: {
                        text: 'CPU监控'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: []
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
                        smooth: true
                    }]
                }
            }
        },
        computed: {
            ...mapState(['redis_ip', 'chart_data', 'chart_change_count']),
        },
        watch: {
            chart_change_count() {
                this.updateCharts()
            },
        },
        methods: {
            ...mapMutations(['initWS']),
            updateCharts() {
                this.option.xAxis[0].data = this.chart_data.time_data[this.redis_ip];
                this.option.xAxis[1].data = this.chart_data.time_data[this.redis_ip];
                this.option.series[0].data = this.chart_data.info_input_kbps[this.redis_ip];
                this.option.series[1].data = this.chart_data.info_output_kbps[this.redis_ip];
                this.myChart.setOption(this.option);

                this.option1.xAxis.data = this.chart_data.time_data[this.redis_ip];
                this.option1.series[0].data = this.chart_data.info_used_memory[this.redis_ip];
                this.myChart1.setOption(this.option1);

                this.option2.xAxis.data = this.chart_data.time_data[this.redis_ip];
                this.option2.series[0].data = this.chart_data.info_ops_per_sec[this.redis_ip];
                this.myChart2.setOption(this.option2);

                this.option3.xAxis.data = this.chart_data.time_data[this.redis_ip];
                this.option3.series[0].data = this.chart_data.info_used_cpu_user[this.redis_ip];
                this.myChart3.setOption(this.option3);
            }
        },
        mounted() {
            this.myChart = echarts.init(this.$refs.chart);
            this.myChart1 = echarts.init(this.$refs.chart1);
            this.myChart2 = echarts.init(this.$refs.chart2);
            this.myChart3 = echarts.init(this.$refs.chart3);
            this.myChart.setOption(this.option);
            this.myChart1.setOption(this.option1);
            this.myChart2.setOption(this.option2);
            this.myChart3.setOption(this.option3);
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
