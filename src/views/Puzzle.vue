<template>
  <div class="page-container">
    <h1>题目管理</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <div class="left-buttons">
        <a-button type="primary" @click="showEditModal()">
          <plus-outlined /> 新建题目
        </a-button>
        <a-button type="warning" class="swap-pid-btn" @click="showSwapModal">
          PID交换
        </a-button>
      </div>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchPuzzleList">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 题目列表 -->
    <a-table
      :columns="columns"
      :data-source="puzzleList"
      :loading="loading"
      row-key="pid"
      :row-class-name="getRowClassName"
      :pagination="false"
    >
      <!-- 表格列自定义渲染 -->
      <template #bodyCell="{ column, record }">
        <!-- 所属分区 -->
        <template v-if="column.key === 'pgid'">
          <div>
            {{ getPuzzleGroupName(record.pgid) }}
            <a-tooltip title="隐藏分区">
              <lock-outlined v-if="isPuzzleGroupHidden(record.pgid)" style="margin-left: 5px" />
            </a-tooltip>
          </div>
        </template>

        <!-- 题目类型 -->
        <template v-if="column.key === 'answer_type'">
          {{ getAnswerTypeName(record.answer_type) }}
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这个题目吗？"
              @confirm="handleDelete(record.pid)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- PID交换对话框 -->
    <a-modal
      v-model:open="swapModalVisible"
      title="PID交换"
      @ok="handleSwapPids"
      @cancel="swapModalVisible = false"
    >
      <div class="swap-container">
        <a-select
          v-model:value="swapInfo.pid1"
          style="width: 45%"
          placeholder="选择第一个题目"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="puzzle in puzzleList" :key="puzzle.pid" :value="puzzle.pid">
            {{ puzzle.pid }} / {{ puzzle.title }} / {{ puzzle.answer }}
          </a-select-option>
        </a-select>
        
        <swap-outlined class="swap-icon" />
        
        <a-select
          v-model:value="swapInfo.pid2"
          style="width: 45%"
          placeholder="选择第二个题目"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="puzzle in puzzleList" :key="puzzle.pid" :value="puzzle.pid">
            {{ puzzle.pid }} / {{ puzzle.title }} / {{ puzzle.answer }}
          </a-select-option>
        </a-select>
      </div>
    </a-modal>

    <!-- 编辑模态框 - 仅占位，后续实现 -->
    <a-modal
      v-model:open="modalVisible"
      :title="currentPuzzle.pid ? '编辑题目' : '新建题目'"
      @ok="handleSave"
      @cancel="modalVisible = false"
      width="90vw"
    >
      <p>题目编辑界面内容待实现...</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, LockOutlined, SwapOutlined } from '@ant-design/icons-vue';
import {
  getPuzzleGroups,
  getPuzzleList,
  deletePuzzle,
  swapPuzzlePids
} from '@/api/puzzle';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'pid',
    width: 80,
  },
  {
    title: '所属分区',
    key: 'pgid',
    width: 180,
  },
  {
    title: '标题',
    dataIndex: 'title',
    ellipsis: true,
    width: '30%',
  },
  {
    title: '备注',
    dataIndex: 'desc',
    ellipsis: true,
    width: '30%',
  },
  {
    title: '题目类型',
    key: 'answer_type',
    width: 120,
  },
  {
    title: '答案',
    dataIndex: 'answer',
    width: 200,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
];

// 数据状态
const loading = ref(false);
const puzzleList = ref([]);
const puzzleGroups = ref([]);
const modalVisible = ref(false);
const swapModalVisible = ref(false);
const currentPuzzle = ref({
  pid: null,
  // 其他字段将在实际实现编辑功能时添加
});

// PID交换信息
const swapInfo = ref({
  pid1: null,
  pid2: null
});

// 获取题目列表
const fetchPuzzleList = async () => {
  loading.value = true;
  try {
    const result = await getPuzzleList();
    puzzleList.value = result.puzzle || [];
  } catch (error) {
    console.error('获取题目列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取题目分区列表
const fetchPuzzleGroups = async () => {
  try {
    const result = await getPuzzleGroups();
    puzzleGroups.value = result.puzzle_group || [];
  } catch (error) {
    console.error('获取题目分区列表失败:', error);
  }
};

// 获取分区名称
const getPuzzleGroupName = (pgid) => {
  const group = puzzleGroups.value.find(group => group.pgid === pgid);
  return group ? group.pg_name : '未知分区';
};

// 判断分区是否隐藏
const isPuzzleGroupHidden = (pgid) => {
  const group = puzzleGroups.value.find(group => group.pgid === pgid);
  return group ? group.is_hide === 1 : false;
};

// 获取题目类型名称
const getAnswerTypeName = (answerType) => {
  switch (answerType) {
    case 0: return '小题';
    case 1: return '分区Meta';
    case 2: return 'MetaMeta';
    case 3: return 'FinalMeta';
    case 4: return '不计分题目';
    default: return '未知类型';
  }
};

// 设置行样式
const getRowClassName = (record) => {
  switch (record.answer_type) {
    case 1: return 'puzzle-meta-row';      // 分区Meta - 淡绿色
    case 2:
    case 3: return 'puzzle-metameta-row';  // MetaMeta/FinalMeta - 浅橙色
    case 4: return 'puzzle-nonscored-row'; // 不计分题目 - 浅灰色
    default: return '';
  }
};

// 显示编辑模态框
const showEditModal = (record = null) => {
  if (record) {
    // 编辑现有题目
    currentPuzzle.value = { ...record };
  } else {
    // 新建题目
    currentPuzzle.value = {
      pid: null,
      // 其他默认值将在实际实现编辑功能时添加
    };
  }
  modalVisible.value = true;
};

// 显示PID交换对话框
const showSwapModal = () => {
  swapInfo.value = {
    pid1: null,
    pid2: null
  };
  swapModalVisible.value = true;
};

// 保存题目（仅占位）
const handleSave = async () => {
  // 将在实际实现编辑功能时添加
  message.info('题目编辑功能待实现');
  modalVisible.value = false;
};

// 删除题目
const handleDelete = async (pid) => {
  try {
    await deletePuzzle(pid);
    message.success('删除题目成功');
    fetchPuzzleList();
  } catch (error) {
    console.error('删除题目失败:', error);
  }
};

// 交换PID
const handleSwapPids = async () => {
  const { pid1, pid2 } = swapInfo.value;
  
  if (!pid1 || !pid2) {
    message.warning('请选择两个题目进行交换');
    return;
  }
  
  if (pid1 === pid2) {
    message.warning('不能选择相同的题目进行交换');
    return;
  }
  
  try {
    await swapPuzzlePids(pid1, pid2);
    message.success('PID交换成功');
    swapModalVisible.value = false;
    fetchPuzzleList();
  } catch (error) {
    console.error('PID交换失败:', error);
  }
};

// 下拉菜单筛选方法
const filterOption = (input, option) => {
  if (!input || !option.value) return true;
  
  // 在列表中找到对应pid的题目
  const puzzle = puzzleList.value.find(p => p.pid === option.value);
  if (!puzzle) return false;
  
  // 构建完整的题目信息文本
  const puzzleInfo = `${puzzle.pid} / ${puzzle.title} / ${puzzle.answer}`;
  
  // 判断是否匹配输入
  return puzzleInfo.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

onMounted(() => {
  fetchPuzzleGroups();
  fetchPuzzleList();
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

.left-buttons {
  display: flex;
  gap: 8px;
}

.swap-pid-btn {
  background-color: #fa8c16;
  border-color: #fa8c16;
  color: #fff;
}

.swap-pid-btn:hover {
  background-color: #fa9d32;
  border-color: #fa9d32;
  color: #fff;
}

.swap-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.swap-icon {
  font-size: 20px;
  color: #1890ff;
}

/* 题目类型行样式 */
:deep(.puzzle-meta-row) {
  background-color: rgba(82, 196, 26, 0.1);
}

:deep(.puzzle-metameta-row) {
  background-color: rgba(250, 140, 22, 0.1);
}

:deep(.puzzle-nonscored-row) {
  background-color: rgba(191, 191, 191, 0.2);
}
</style> 