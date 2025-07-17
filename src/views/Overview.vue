<template>
  <div class="overview">
    <div class="overview-header">
      <h1>CCXC Admin</h1>
      <div class="server-time" v-if="overviewData">
        <a-icon type="clock-circle" />
        <span>服务器时间: {{ overviewData.now }}</span>
      </div>
    </div>
    
    <a-spin :spinning="loading">
      <div class="stats-cards" v-if="overviewData">
        <div class="stat-card">
          <div class="stat-icon user-icon">
            <a-icon type="user" />
          </div>
          <div class="stat-info">
            <div class="stat-title">注册用户</div>
            <div class="stat-value">{{ formatNumber(overviewData.user_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon group-icon">
            <a-icon type="team" />
          </div>
          <div class="stat-info">
            <div class="stat-title">已报名人数</div>
            <div class="stat-value">{{ formatNumber(overviewData.group_bind_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon team-icon">
            <a-icon type="cluster" />
          </div>
          <div class="stat-info">
            <div class="stat-title">报名队伍</div>
            <div class="stat-value">{{ formatNumber(overviewData.group_count) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon online-icon">
            <a-icon type="wifi" />
          </div>
          <div class="stat-info">
            <div class="stat-title">当前在线</div>
            <div class="stat-value">{{ formatNumber(overviewData.online_count) }}</div>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOverviewData } from '@/api/overview';

const loading = ref(false);
const overviewData = ref(null);

const fetchOverviewData = async () => {
  loading.value = true;
  try {
    const { result } = await getOverviewData();
    overviewData.value = result;
  } catch (error) {
    console.error('获取概览数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

onMounted(() => {
  fetchOverviewData();
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
}
</style> 