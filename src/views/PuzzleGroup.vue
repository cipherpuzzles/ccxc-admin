<template>
  <div class="page-container">
    <h1>题目分区</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-button type="primary" @click="showEditModal()">
        <plus-outlined /> 新建分区
      </a-button>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchPuzzleGroups">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 分区列表 -->
    <a-table
      :columns="columns"
      :data-source="puzzleGroups"
      :loading="loading"
      row-key="pgid"
    >
      <!-- 自定义单元格内容 -->
      <template #bodyCell="{ column, record }">
        <!-- 分区名称 -->
        <template v-if="column.key === 'pg_name'">
          <span>{{ record.pg_name }}</span>
          <eye-invisible-outlined v-if="record.is_hide === 1" style="margin-left: 8px; color: #999;" />
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这个题目分区吗？"
              @confirm="handleDelete(record.pgid)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 编辑模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="currentGroup.pgid ? '编辑分区' : '新建分区'"
      @ok="handleSave"
      @cancel="handleCancel"
      width="600px"
    >
      <a-form :model="currentGroup" layout="vertical">
        <a-form-item label="分区名称" required>
          <a-input v-model:value="currentGroup.pg_name" />
        </a-form-item>

        <a-form-item label="分区简介">
          <a-textarea 
            v-model:value="currentGroup.pg_desc" 
            :rows="4" 
            :auto-size="{ minRows: 4, maxRows: 8 }" 
          />
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="currentGroup.is_hide">隐藏此分区</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';
import { getPuzzleGroups } from '@/api/puzzle';
import { addPuzzleGroup, editPuzzleGroup, deletePuzzleGroup } from '@/api/puzzle';

// 表格列定义
const columns = [
  {
    title: '分区ID',
    dataIndex: 'pgid',
    width: 100,
  },
  {
    title: '分区名称',
    key: 'pg_name',
    width: 200,
  },
  {
    title: '分区简介',
    dataIndex: 'pg_desc',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
];

// 数据状态
const loading = ref(false);
const puzzleGroups = ref([]);
const modalVisible = ref(false);
const currentGroup = ref({
  pgid: null,
  pg_name: '',
  pg_desc: '',
  is_hide: false
});

// 获取题目分区列表
const fetchPuzzleGroups = async () => {
  loading.value = true;
  try {
    const result = await getPuzzleGroups();
    puzzleGroups.value = result.puzzle_group;
  } catch (error) {
    console.error('获取题目分区列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 显示编辑模态框
const showEditModal = (record = null) => {
  if (record) {
    currentGroup.value = {
      pgid: record.pgid,
      pg_name: record.pg_name,
      pg_desc: record.pg_desc,
      is_hide: record.is_hide === 1
    };
  } else {
    currentGroup.value = {
      pgid: null,
      pg_name: '',
      pg_desc: '',
      is_hide: false
    };
  }
  modalVisible.value = true;
};

// 保存分区
const handleSave = async () => {
  try {
    const { pgid, pg_name, pg_desc, is_hide } = currentGroup.value;
    const isHideNum = is_hide ? 1 : 0;
    
    if (!pg_name.trim()) {
      message.error('分区名称不能为空');
      return;
    }
    
    if (pgid) {
      await editPuzzleGroup(pgid, pg_name, pg_desc, isHideNum);
      message.success('编辑分区成功');
    } else {
      await addPuzzleGroup(pg_name, pg_desc, isHideNum);
      message.success('新建分区成功');
    }

    modalVisible.value = false;
    fetchPuzzleGroups();
  } catch (error) {
    console.error('保存分区失败:', error);
  }
};

// 删除分区
const handleDelete = async (pgid) => {
  try {
    await deletePuzzleGroup(pgid);
    message.success('删除分区成功');
    fetchPuzzleGroups();
  } catch (error) {
    console.error('删除分区失败:', error);
  }
};

// 取消编辑
const handleCancel = () => {
  modalVisible.value = false;
};

onMounted(() => {
  fetchPuzzleGroups();
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

.operation-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}
</style> 