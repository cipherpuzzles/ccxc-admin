<template>
  <div class="page-container">
    <h1>人工提示</h1>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <a-form :model="queryParams">
        <div class="form-content">
          <div class="form-left">
            <a-form-item label="队伍">
              <a-select
                v-model:value="queryParams.gid"
                mode="multiple"
                show-search
                placeholder="请选择队伍"
                :options="groupOptions"
                :filter-option="filterGroupOption"
                style="min-width: 200px"
              />
            </a-form-item>
            
            <a-form-item label="题目">
              <a-select
                v-model:value="queryParams.pid"
                mode="multiple"
                show-search
                placeholder="请选择题目"
                :options="problemOptions"
                :filter-option="filterProblemOption"
                style="min-width: 200px"
              />
            </a-form-item>

            <a-form-item label="状态">
              <a-select v-model:value="queryParams.reply" style="min-width: 120px">
                <a-select-option :value="0">全部</a-select-option>
                <a-select-option :value="1">已回复</a-select-option>
                <a-select-option :value="2">未回复</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="时间排序">
              <a-select v-model:value="queryParams.order" style="min-width: 120px">
                <a-select-option :value="0">最新在前</a-select-option>
                <a-select-option :value="1">最老在前</a-select-option>
              </a-select>
            </a-form-item>
          </div>
          
          <div class="form-right">
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="handleSearch">查询</a-button>
                <a-button @click="handleReset">重置</a-button>
              </a-space>
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>

    <!-- 人工提示列表 -->
    <a-table
      :columns="columns"
      :data-source="oracleList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="oracle_id"
    >
      <!-- 自定义列内容 -->
      <template #bodyCell="{ column, record }">
        <!-- 状态 -->
        <template v-if="column.key === 'status'">
          <div class="oracle-status">
            <span>{{ record.oracle_id }}</span>
            <a-tag :color="record.is_reply === 1 ? 'success' : 'warning'">
              {{ record.is_reply === 1 ? '已回复' : '未回复' }}
            </a-tag>
          </div>
        </template>

        <!-- 队伍 -->
        <template v-if="column.key === 'group'">
          <a @click="setFilterGroup(record.gid)">{{ record.gid }} / {{ record.group_name }}</a>
        </template>

        <!-- 发送时间 -->
        <template v-if="column.key === 'create_time'">
          {{ formatTime(record.create_time) }}
        </template>

        <!-- 题目 -->
        <template v-if="column.key === 'problem'">
          <a @click="setFilterProblem(record.pid)">G{{ record.pgid }} / {{ record.pid }} / {{ record.puzzle_title }}</a>
        </template>

        <!-- 操作 -->
        <template v-if="column.key === 'action'">
          <a-button type="primary" size="small" @click="openDrawer(record)">
            详情
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      title="提示详情"
      placement="right"
      :width="700"
      :footer-style="{ textAlign: 'right' }"
    >
      <div v-if="currentRecord" class="drawer-content">
        <!-- 队伍信息 -->
        <div class="info-section">
          <div class="info-value">{{ currentRecord.gid }} / {{ currentRecord.group_name }}</div>
        </div>

        <!-- 时间信息 -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">发送时间：</span>
            <span class="info-value">{{ formatTime(currentRecord.create_time) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">最后编辑时间：</span>
            <span class="info-value">{{ formatTime(currentRecord.update_time) }}</span>
          </div>
        </div>

        <!-- 题目信息 -->
        <div class="info-section">
          <div class="info-label">题目：</div>
          <div class="info-value">G{{ currentRecord.pgid }} / {{ currentRecord.pid }} / {{ currentRecord.puzzle_title }}</div>
        </div>

        <!-- 提问内容 -->
        <div class="content-section">
          <div class="section-title">提问内容：</div>
          <div class="content-box">
            <markdown-renderer :content="currentRecord.question_content" />
          </div>
        </div>

        <!-- 回复部分 -->
        <div class="content-section">
          <div class="section-title">回复：</div>
          
          <!-- 回复解锁时间 -->
          <div class="info-row">
            <span class="info-label">回复解锁时间：</span>
            <span class="info-value">{{ formatTime(currentRecord.unlock_time) }}</span>
          </div>
          
          <!-- 回复时间 -->
          <div class="info-row">
            <span class="info-label">回复时间：</span>
            <span class="info-value">
              {{ currentRecord.is_reply === 1 ? formatTime(currentRecord.reply_time) : '未回复' }}
            </span>
          </div>
          
          <!-- Monaco编辑器 -->
          <div class="editor-container">
            <monaco-editor
              v-model:value="replyContent"
              language="markdown"
              :height="300"
            />
          </div>
          
          <!-- 同时解锁提示 -->
          <div class="extend-function">
            <span class="info-label">同时解锁提示：</span>
            <a-select
              v-model:value="extendFunction"
              mode="tags"
              style="width: 300px"
              placeholder="请选择或输入同时解锁的提示ID"
            />
          </div>
          
          <!-- 提交按钮 -->
          <div class="submit-section">
            <a-button 
              type="primary" 
              :loading="submitting" 
              @click="submitReply"
            >
              {{ currentRecord.is_reply === 1 ? '提交编辑' : '提交回复' }}
            </a-button>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getSelectItems } from '@/api/log';
import { getOracleList, replyOracle } from '@/api/oracle';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import MonacoEditor from '@/components/MonacoEditor.vue';

// 查询参数
const queryParams = ref({
  gid: [],
  pid: [],
  reply: 0,
  order: 0,
  page: 1
});

// 表格数据
const loading = ref(false);
const oracleList = ref([]);
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 20,
  showTotal: (total) => `共 ${total} 条记录`
});

// 下拉选项
const groupOptions = ref([]);
const problemOptions = ref([]);

// 抽屉相关
const drawerVisible = ref(false);
const currentRecord = ref(null);
const replyContent = ref('');
const extendFunction = ref(['1', '2', '3']);
const submitting = ref(false);

// 表格列定义
const columns = [
  {
    title: '状态',
    key: 'status',
    width: 150
  },
  {
    title: '队伍',
    key: 'group',
    width: 200
  },
  {
    title: '发送时间',
    key: 'create_time',
    width: 180
  },
  {
    title: '题目',
    key: 'problem',
    width: 250
  },
  {
    title: '提问内容',
    dataIndex: 'question_content',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right'
  }
];

// 获取下拉选项数据
const fetchSelectItems = async () => {
  try {
    const result = await getSelectItems();
    
    // 处理队伍选项
    if (result.gid_item && Array.isArray(result.gid_item)) {
      groupOptions.value = result.gid_item.map(item => ({
        label: `${item.gid} / ${item.group_name}`,
        value: item.gid,
        gid: item.gid,
        group_name: item.group_name
      }));
    }
    
    // 处理题目选项
    if (result.pid_item && Array.isArray(result.pid_item)) {
      problemOptions.value = result.pid_item.map(item => ({
        label: `G${item.pgid} / ${item.pid} / ${item.title}`,
        value: item.pid,
        pid: item.pid,
        pgid: item.pgid,
        title: item.title
      }));
    }
  } catch (error) {
    console.error('获取下拉选项数据失败:', error);
    message.error('获取下拉选项数据失败');
  }
};

// 获取人工提示列表
const fetchOracleList = async () => {
  loading.value = true;
  try {
    const result = await getOracleList(queryParams.value);
    
    oracleList.value = result.oracles || [];
    pagination.value = {
      ...pagination.value,
      total: result.total_count,
      current: result.page,
      pageSize: result.page_size
    };
  } catch (error) {
    console.error('获取人工提示列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) {
    message.warning('回复内容不能为空');
    return;
  }
  
  submitting.value = true;
  try {
    const result = await replyOracle({
      oracle_id: currentRecord.value.oracle_id,
      reply_content: replyContent.value,
      extend_function: extendFunction.value
    });
    
    if (result.status === 1) {
      message.success(currentRecord.value.is_reply === 1 ? '编辑回复成功' : '回复成功');
      drawerVisible.value = false;
      fetchOracleList(); // 刷新列表
    }
  } catch (error) {
    console.error('提交回复失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 过滤队伍选项
const filterGroupOption = (input, option) => {
  const searchText = input.toLowerCase();
  const groupName = option.group_name.toLowerCase();
  const gid = option.gid.toString();
  
  return groupName.includes(searchText) || gid.includes(searchText);
};

// 过滤题目选项
const filterProblemOption = (input, option) => {
  const searchText = input.toLowerCase();
  const title = option.title.toLowerCase();
  const pid = option.pid.toString();
  const pgid = option.pgid.toString();
  
  return title.includes(searchText) || pid.includes(searchText) || pgid.includes(searchText);
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '无';
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 事件处理函数
const handleSearch = () => {
  queryParams.value.page = 1;
  fetchOracleList();
};

const handleReset = () => {
  queryParams.value = {
    gid: [],
    pid: [],
    reply: 0,
    order: 0,
    page: 1
  };
  fetchOracleList();
};

const handleTableChange = (pag) => {
  queryParams.value.page = pag.current;
  fetchOracleList();
};

// 打开详情抽屉
const openDrawer = (record) => {
  currentRecord.value = record;
  replyContent.value = record.reply_content || '';
  
  // 处理同时解锁的提示ID
  if (record.extend_function) {
    extendFunction.value = record.extend_function.split(',');
  } else {
    extendFunction.value = ['1', '2', '3'];
  }
  
  drawerVisible.value = true;
};

// 设置筛选条件
const setFilterGroup = (gid) => {
  queryParams.value.gid = [gid];
};

const setFilterProblem = (pid) => {
  queryParams.value.pid = [pid];
};

// 监听抽屉关闭
watch(() => drawerVisible.value, (isOpen) => {
  if (!isOpen) {
    currentRecord.value = null;
    replyContent.value = '';
    extendFunction.value = ['1', '2', '3'];
  }
});

onMounted(() => {
  fetchSelectItems();
  fetchOracleList();
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

.filter-container {
  margin-bottom: 24px;
  padding: 24px;
  background: #fafafa;
  border-radius: 4px;
}

.form-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.form-left {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-right: 24px;
}

.form-right {
  flex-shrink: 0;
  padding-top: 4px;
}

:deep(.ant-form-item) {
  margin-bottom: 0;
  min-width: 240px;
}

:deep(.ant-form-item-label) {
  min-width: 80px;
}

.oracle-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 抽屉样式 */
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  margin-bottom: 5px;
}

.info-row {
  display: flex;
  margin-bottom: 5px;
}

.info-label {
  font-weight: 500;
  margin-right: 8px;
  min-width: 120px;
}

.section-title {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.content-section {
  margin-top: 24px;
}

.content-box {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 16px;
}

.editor-container {
  margin: 16px 0;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.extend-function {
  display: flex;
  align-items: center;
  margin: 16px 0;
}

.submit-section {
  margin-top: 24px;
  text-align: right;
}
</style> 