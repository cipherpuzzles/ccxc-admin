<template>
  <div class="page-container">
    <h1>插件管理</h1>
    
    <!-- 警告条 -->
    <a-alert
      message="激活或取消插件后，必须手工重启后端才能生效。"
      type="warning"
      show-icon
      style="margin-bottom: 24px"
    />
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space>
        <a-button type="primary" @click="handleReloadPluginInfo" :loading="reloadLoading">
          <Icons.ReloadOutlined />
          重新扫描插件目录
        </a-button>
      </a-space>
      <a-button @click="fetchPluginList" :loading="loading">
        <Icons.SyncOutlined />
        重载列表
      </a-button>
    </div>

    <!-- 插件列表 -->
    <a-table
      :columns="columns"
      :data-source="pluginList"
      :loading="loading"
      :pagination="false"
      row-key="plugin_name"
    >
      <!-- 插件名称 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'plugin_title'">
          <div class="plugin-info">
            <div class="plugin-header">
              <component :is="getIconComponent(record.icon)" class="plugin-icon" />
              <span class="plugin-title">{{ record.plugin_title }}</span>
            </div>
            <div class="plugin-name">{{ record.plugin_name }}</div>
            <div v-if="record.status === 1 && record.active_time" class="active-time">
              激活时间: {{ formatTime(record.active_time) }}
            </div>
          </div>
        </template>
        
        <!-- 激活状态 -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '已激活' : '未激活' }}
          </a-tag>
        </template>

        <!-- 操作按钮 -->
        <template v-else-if="column.key === 'action'">
          <a-button
            :type="record.status === 1 ? 'danger' : 'primary'"
            size="small"
            @click="handleToggleStatus(record)"
            :loading="record.loading"
          >
            {{ record.status === 1 ? '取消激活' : '激活' }}
          </a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import * as Icons from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { 
  getPluginList, 
  reloadPluginInfo,
  setPluginStatus
} from '@/api/plugin';

// 数据
const loading = ref(false);
const reloadLoading = ref(false);
const pluginList = ref([]);

// 表格列定义
const columns = [
  {
    title: '插件名称',
    key: 'plugin_title',
    width: 300,
  },
  {
    title: '版本',
    dataIndex: 'version',
    width: 100,
  },
  {
    title: '作者',
    dataIndex: 'author',
    width: 150,
  },
  {
    title: '激活状态',
    key: 'status',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
  }
];

// 获取图标组件
const getIconComponent = (iconName) => {
  // 如果图标名称存在于Icons中，返回对应的图标组件，否则返回默认图标
  return Icons[iconName] || Icons.AppstoreOutlined;
};

// 获取插件列表数据
const fetchPluginList = async () => {
  loading.value = true;
  try {
    const result = await getPluginList();
    pluginList.value = result.plugin_list.map(plugin => ({
      ...plugin,
      loading: false
    }));
  } catch (error) {
    console.error('获取插件列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 重新扫描插件目录
const handleReloadPluginInfo = async () => {
  reloadLoading.value = true;
  try {
    const result = await reloadPluginInfo();
    if (result.status === 1) {
      message.success('重新扫描插件目录成功');
      await fetchPluginList();
    }
  } catch (error) {
    console.error('重新扫描插件目录失败:', error);
  } finally {
    reloadLoading.value = false;
  }
};

// 切换插件激活状态
const handleToggleStatus = async (record) => {
  const newStatus = record.status === 1 ? 0 : 1;
  record.loading = true;
  
  try {
    const result = await setPluginStatus(record.plugin_name, newStatus);
    if (result.status === 1) {
      message.success(newStatus === 1 ? '插件激活成功' : '插件取消激活成功');
      await fetchPluginList();
    }
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    record.loading = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

onMounted(() => {
  fetchPluginList();
});
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

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.plugin-info {
  display: flex;
  flex-direction: column;
}

.plugin-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.plugin-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #1890ff;
}

.plugin-title {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.plugin-name {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-bottom: 2px;
}

.active-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style> 