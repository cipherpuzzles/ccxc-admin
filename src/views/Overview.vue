<template>
  <div class="overview">
    <h1>CCXC Admin</h1>
    <a-spin :spinning="loading">
      <div class="overview-content" v-if="overviewData" v-html="overviewData">
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

onMounted(() => {
  fetchOverviewData();
});
</script>

<style scoped>
.overview {
  padding: 24px;
  background: #fff;
  min-height: 360px;
  border-radius: 4px;
}

h1 {
  margin-bottom: 20px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 24px;
}

.overview-content {
  margin-top: 16px;
}

pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
}
</style> 