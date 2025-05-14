<template>
  <div class="page-container">
    <h1>清理缓存</h1>
    
    <!-- 警告条 -->
    <a-alert
      type="warning"
      message="进行以下操作需管理员权限：本页面操作将直接删除Redis缓存，请谨慎操作。"
      banner
      style="margin-bottom: 20px"
    />
    
    <!-- 缓存清理按钮组 -->
    <div class="cache-buttons">
      <a-row :gutter="[16, 16]">
        <a-col :span="6" v-for="item in cacheItems" :key="item.key">
          <a-button 
            type="primary" 
            danger
            size="large"
            style="width: 100%; background-color: #fa8c16; border-color: #fa8c16"
            @click="handlePurgeCache(item.key)"
            :loading="loading === item.key"
          >
            {{ item.label }}
          </a-button>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { purgeCache } from '@/api/setting';

// 缓存项列表
const cacheItems = [
  { label: '公告', key: 'anno' },
  { label: '邀请', key: 'invi' },
  { label: '站内信', key: 'mess' },
  { label: '进度', key: 'prog' },
  { label: '题目', key: 'puzz' },
  { label: '分区', key: 'puzg' },
  { label: '题目和分区', key: 'pall' },
  { label: '用户', key: 'user' },
  { label: '组队', key: 'useg' },
  { label: '用户绑定', key: 'usgb' },
  { label: '用户相关全部', key: 'uall' },
  { label: '全部', key: 'aall' }
];

const loading = ref('');

// 处理清理缓存
const handlePurgeCache = async (op_key) => {
  loading.value = op_key;
  
  try {
    await purgeCache(op_key);
    message.success(`${getCacheLabelByKey(op_key)}缓存清理成功`);
  } catch (error) {
    console.error('缓存清理失败:', error);
  } finally {
    loading.value = '';
  }
};

// 根据key获取对应的缓存标签文本
const getCacheLabelByKey = (key) => {
  const item = cacheItems.find(item => item.key === key);
  return item ? item.label : '';
};
</script>

<style scoped>
.page-container {
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

.cache-buttons {
  margin-top: 24px;
}
</style> 