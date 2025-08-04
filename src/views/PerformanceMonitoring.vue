<template>
  <div class="performance-monitoring">
    <div class="header">
      <h2>性能监控</h2>
      <a-button 
        type="primary" 
        :loading="loading" 
        @click="refreshData"
        style="margin-bottom: 16px;"
      >
        <template #icon>
          <reload-outlined />
        </template>
        刷新数据
      </a-button>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card title="CPU 占用率" :bordered="false">
          <div id="cpuChart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
      
      <a-col :span="24">
        <a-card title="内存使用率" :bordered="false">
          <div id="memoryChart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
      
      <a-col :span="24">
        <a-card title="磁盘空间使用率" :bordered="false">
          <div id="diskChart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { getPerformanceData } from '@/api/performance';
import * as echarts from 'echarts';

const loading = ref(false);
const performanceData = ref({
  cpu: [],
  memory: [],
  disk_space: []
});

let cpuChart = null;
let memoryChart = null;
let diskChart = null;

// 格式化时间戳为可读格式
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 创建图表配置
const createChartOption = (title, data, unit = '%', color = '#1890ff') => {
  return {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const point = params[0];
        return `${formatTimestamp(point.data[0])}<br/>${point.seriesName}: ${point.data[1]}${unit}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value);
          return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: title,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: color,
          width: 2
        },
        itemStyle: {
          color: color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: color + '40'
            },
            {
              offset: 1,
              color: color + '10'
            }
          ])
        },
        data: data.map(item => [item.ts, item.value])
      }
    ]
  };
};

// 初始化图表
const initCharts = async () => {
  await nextTick();
  
  // 销毁现有图表
  if (cpuChart) cpuChart.dispose();
  if (memoryChart) memoryChart.dispose();
  if (diskChart) diskChart.dispose();
  
  // 创建新图表
  cpuChart = echarts.init(document.getElementById('cpuChart'));
  memoryChart = echarts.init(document.getElementById('memoryChart'));
  diskChart = echarts.init(document.getElementById('diskChart'));
  
  // 设置图表配置
  cpuChart.setOption(createChartOption('CPU 占用率', performanceData.value.cpu, '%', '#1890ff'));
  memoryChart.setOption(createChartOption('内存使用率', performanceData.value.memory, '%', '#52c41a'));
  diskChart.setOption(createChartOption('磁盘空间使用率', performanceData.value.disk_space, '%', '#faad14'));
  
  // 添加窗口大小变化监听
  const handleResize = () => {
    cpuChart && cpuChart.resize();
    memoryChart && memoryChart.resize();
    diskChart && diskChart.resize();
  };
  
  window.addEventListener('resize', handleResize);
};

// 获取性能数据
const fetchPerformanceData = async () => {
  try {
    loading.value = true;
    const response = await getPerformanceData();
    performanceData.value = {
      cpu: response.cpu || [],
      memory: response.memory || [],
      disk_space: response.disk_space || []
    };
    
    // 重新初始化图表
    await initCharts();

  } catch (error) {
    console.error('获取性能数据错误:', error);
    message.error('获取性能数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  fetchPerformanceData();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchPerformanceData();
});

// 组件卸载时销毁图表
onUnmounted(() => {
  if (cpuChart) cpuChart.dispose();
  if (memoryChart) memoryChart.dispose();
  if (diskChart) diskChart.dispose();
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.performance-monitoring {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 500;
}

:deep(.ant-card-body) {
  padding: 24px;
}
</style>