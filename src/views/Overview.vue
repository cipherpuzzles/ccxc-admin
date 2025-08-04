<template>
  <div class="overview">
    <div class="overview-header">
      <h1>CCXC Admin</h1>
      <div class="server-time" v-if="overviewData">
        <ClockCircleOutlined />
        <span>服务器时间: {{ overviewData.now }}</span>
      </div>
    </div>
    
    <a-spin :spinning="loading">
      <div class="stats-cards" v-if="overviewData">
        <div class="stat-card">
          <div class="stat-icon user-icon">
            <UserOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-title">注册用户</div>
            <div class="stat-value">{{ formatNumber(overviewData.user_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon group-icon">
            <TeamOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-title">已报名人数</div>
            <div class="stat-value">{{ formatNumber(overviewData.group_bind_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon team-icon">
            <ClusterOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-title">报名队伍</div>
            <div class="stat-value">{{ formatNumber(overviewData.group_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon online-icon">
            <WifiOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-title">当前在线</div>
            <div class="stat-value">{{ formatNumber(overviewData.online_count) }}</div>
          </div>
        </div>
      </div>
    </a-spin>

    <!-- 每日登录图表 -->
    <div class="chart-section" v-if="overviewData && dailyLoginData.length > 0">
      <div class="chart-header">
        <h2>近一个月每日登录用户数量</h2>
      </div>
      <div class="chart-container">
        <div ref="chartRef" class="login-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { getOverviewData } from '@/api/overview';
import * as echarts from 'echarts';
import { 
  UserOutlined, 
  TeamOutlined, 
  ClusterOutlined, 
  WifiOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons-vue';

const loading = ref(false);
const overviewData = ref(null);
const dailyLoginData = ref([]);
const chartRef = ref(null);
let chartInstance = null;

const fetchOverviewData = async () => {
  loading.value = true;
  try {
    const { result, daily_login_count } = await getOverviewData();
    overviewData.value = result;
    dailyLoginData.value = daily_login_count || [];
    
    // 等待DOM更新后初始化图表
    await nextTick();
    initChart();
  } catch (error) {
    console.error('获取概览数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const initChart = () => {
  if (!chartRef.value || dailyLoginData.value.length === 0) return;
  
  // 如果图表实例已存在，先销毁
  if (chartInstance) {
    chartInstance.dispose();
  }
  
  // 初始化图表
  chartInstance = echarts.init(chartRef.value);
  
  // 处理数据
  const sortedData = dailyLoginData.value
    .sort((a, b) => new Date(a.d) - new Date(b.d))
    .slice(-30); // 只显示最近30天的数据
  
  const dates = sortedData.map(item => {
    const date = new Date(item.d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const counts = sortedData.map(item => item.count);
  
  const option = {
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const data = params[0];
        const originalDate = sortedData[data.dataIndex].d;
        return `日期: ${originalDate}<br/>登录人数: ${data.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisTick: {
        alignWithLabel: true
      },
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '登录人数',
      nameTextStyle: {
        color: '#666'
      }
    },
    series: [
      {
        name: '登录人数',
        type: 'bar',
        barWidth: '60%',
        data: counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance && chartInstance.resize();
  });
};

onMounted(() => {
  fetchOverviewData();
});

// 组件卸载时清理图表实例
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', () => {
    chartInstance && chartInstance.resize();
  });
});
</script>

<style scoped>
.overview {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}

h1 {
  margin: 0;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 28px;
}

.server-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  background: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
}

.chart-section {
  margin-top: 32px;
  max-width: 1200px;
}

.chart-header {
  margin-bottom: 20px;
  padding: 0 8px;
}

.chart-header h2 {
  margin: 0;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 20px;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.login-chart {
  width: 100%;
  height: 400px;
}

.stat-card {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.group-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.team-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.online-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #333;
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 768px) {
  .overview {
    padding: 16px;
  }
  
  .overview-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }

  .chart-section {
    margin-top: 24px;
  }

  .chart-header h2 {
    font-size: 18px;
  }

  .chart-container {
    padding: 16px;
  }

  .login-chart {
    height: 300px;
  }
}
</style> 