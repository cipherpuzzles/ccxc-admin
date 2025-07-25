<template>
  <div class="page-container">
    <h1>同步协作管理</h1>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-button 
        type="primary" 
        @click="refreshData"
        :loading="loading"
        style="margin-right: 16px"
      >
        刷新
      </a-button>
      <a-button 
        type="primary" 
        danger
        @click="deleteAll"
        :loading="deleteAllLoading"
      >
        全部删除
      </a-button>
    </div>
    
    <!-- 文档表格 -->
    <a-table
      :columns="columns"
      :data-source="documents"
      :loading="loading"
      row-key="name"
      style="margin-top: 24px"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button 
            type="primary" 
            danger
            size="small"
            @click="deleteDocument(record.name)"
            :loading="deleteLoading === record.name"
          >
            删除
          </a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getAllDocs, deleteDocByName, deleteAllDocs, getCollaborationBaseURL } from '@/api/collaboration';
import { getGroupNameList } from '@/api/message';

// 响应式数据
const documents = ref([]);
const groupNameMap = ref(new Map()); // gid -> groupname 映射
const loading = ref(false);
const deleteAllLoading = ref(false);
const deleteLoading = ref('');

// 表格列配置
const columns = [
  {
    title: '文档名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'GID',
    dataIndex: 'gid',
    key: 'gid',
    width: 80,
  },
  {
    title: '队名',
    dataIndex: 'groupName',
    key: 'groupName',
    width: 200,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
  },
];

// 获取队名映射
const fetchGroupNameMap = async () => {
  try {
    const result = await getGroupNameList();
    if (result.group_name_list && Array.isArray(result.group_name_list)) {
      const map = new Map();
      result.group_name_list.forEach(item => {
        map.set(item.gid, item.groupname);
      });
      groupNameMap.value = map;
    }
  } catch (error) {
    console.error('获取队名列表失败:', error);
  }
};

// 从文档名中提取GID
const extractGidFromDocName = (docName) => {
  const match = docName.match(/^room_(\d+)$/);
  return match ? parseInt(match[1]) : null;
};

// 获取队名
const getGroupName = (gid) => {
  return groupNameMap.value.get(gid) || '未知队伍';
};

// 获取数据
const fetchDocuments = async () => {
  loading.value = true;
  try {
    const response = await getAllDocs();
    // 根据实际API响应格式解析数据
    const docs = response.data?.docs || [];
    documents.value = docs.map(name => {
      const gid = extractGidFromDocName(name);
      return {
        name,
        gid,
        groupName: gid ? getGroupName(gid) : '无效GID'
      };
    });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    message.error('获取文档列表失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  fetchDocuments();
};

// 删除单个文档
const deleteDocument = async (docName) => {
  deleteLoading.value = docName;
  try {
    await deleteDocByName(docName);
    message.success(`文档 "${docName}" 删除成功`);
    fetchDocuments();
  } catch (error) {
    console.error('删除文档失败:', error);
    message.error(`删除文档 "${docName}" 失败`);
  } finally {
    deleteLoading.value = '';
  }
};

// 全部删除
const deleteAll = async () => {
  if (documents.value.length === 0) {
    message.warning('没有文档需要删除');
    return;
  }
  
  deleteAllLoading.value = true;
  try {
    await deleteAllDocs();
    message.success('所有文档删除成功');
    documents.value = [];
  } catch (error) {
    console.error('删除所有文档失败:', error);
    message.error('删除所有文档失败');
  } finally {
    deleteAllLoading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(async () => {
  // 只在页面加载时获取一次队名列表
  await fetchGroupNameMap();
  // 获取文档列表
  await fetchDocuments();
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

.action-buttons {
  margin-bottom: 16px;
}
</style> 