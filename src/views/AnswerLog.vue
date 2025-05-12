<template>
  <div class="page-container">
    <h1>答案记录</h1>

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
            
            <a-form-item label="用户">
              <a-select
                v-model:value="queryParams.uid"
                mode="multiple"
                show-search
                placeholder="请选择用户"
                :options="userOptions"
                :filter-option="filterUserOption"
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
            
            <a-form-item label="判题结果">
              <a-select
                v-model:value="queryParams.status"
                mode="multiple"
                placeholder="请选择判题结果"
                style="min-width: 200px"
              >
                <a-select-option v-for="(label, value) in statusMap" :key="Number(value)" :value="Number(value)">
                  {{ label }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="答案">
              <a-input v-model:value="queryParams.answer" placeholder="请输入答案关键字" allow-clear />
            </a-form-item>

            <a-form-item label="时间排序">
              <a-select v-model:value="queryParams.order" style="width: 120px">
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

    <!-- 答案记录列表 -->
    <a-table
      :columns="columns"
      :data-source="answerList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <!-- 自定义列内容 -->
      <template #bodyCell="{ column, record }">
        <!-- 回答时间 -->
        <template v-if="column.key === 'create_time'">
          {{ formatTime(record.create_time) }}
        </template>

        <!-- 队伍 -->
        <template v-if="column.key === 'gid'">
          <a class="filter-link" @click="setGroupFilter(record.gid)">{{ getGroupName(record.gid) }}</a>
        </template>

        <!-- 用户 -->
        <template v-if="column.key === 'uid'">
          <a class="filter-link" @click="setUserFilter(record.uid)">{{ getUserName(record.uid) }}</a>
        </template>

        <!-- 题目 -->
        <template v-if="column.key === 'pid'">
          <a class="filter-link" @click="setProblemFilter(record.pid)">{{ getProblemName(record.pid) }}</a>
        </template>

        <!-- 判题结果 -->
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ statusMap[record.status] }}
          </a-tag>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getAnswerLogs, getSelectItems } from '@/api/log';

// 判题结果状态映射
const statusMap = {
  1: '正确',
  2: '错误',
  3: '次数耗尽',
  4: '里程碑',
  5: '存档错误',
  6: '题目不可见',
  7: '解锁提示'
};

// 查询参数
const queryParams = ref({
  gid: [],
  uid: [],
  pid: [],
  status: [],
  answer: '',
  order: 0,
  page: 1
});

// 表格数据
const loading = ref(false);
const answerList = ref([]);
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 20,
  showTotal: (total) => `共 ${total} 条记录`
});

// 下拉选项
const groupOptions = ref([]);
const userOptions = ref([]);
const problemOptions = ref([]);

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '回答时间',
    key: 'create_time',
    width: 180,
  },
  {
    title: '队伍',
    key: 'gid',
    width: 200,
  },
  {
    title: '用户',
    key: 'uid',
    width: 180,
  },
  {
    title: '题目',
    key: 'pid',
    width: 200,
  },
  {
    title: '给出的答案',
    dataIndex: 'answer',
    width: 200,
    ellipsis: true,
  },
  {
    title: '判题结果',
    key: 'status',
    width: 120,
  },
  {
    title: '附加信息',
    dataIndex: 'message',
    width: 200,
    ellipsis: true,
  }
];

// 获取答案记录列表
const fetchAnswerLogs = async () => {
  loading.value = true;
  try {
    const result = await getAnswerLogs(queryParams.value);
    answerList.value = result.answer_log;
    pagination.value = {
      ...pagination.value,
      total: result.total_count,
      current: result.page,
      pageSize: result.page_size
    };
  } catch (error) {
    console.error('获取答案记录失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取下拉选项数据
const fetchSelectItems = async () => {
  try {
    const result = await getSelectItems();
    
    // 设置队伍选项
    groupOptions.value = result.gid_item.map(item => ({
      label: `${item.gid} / ${item.group_name}`,
      value: item.gid,
      gid: item.gid,
      groupName: item.group_name
    }));
    
    // 设置用户选项
    userOptions.value = result.uid_item.map(item => ({
      label: `${item.uid} / ${item.user_name}`,
      value: item.uid,
      uid: item.uid,
      username: item.user_name
    }));
    
    // 设置题目选项
    problemOptions.value = result.pid_item.map(item => ({
      label: `G${item.pgid} / ${item.pid} / ${item.title}`,
      value: item.pid,
      pid: item.pid,
      pgid: item.pgid,
      title: item.title
    }));
  } catch (error) {
    console.error('获取下拉选项数据失败:', error);
  }
};

// 选项过滤函数
const filterGroupOption = (input, option) => {
  const searchText = input.toLowerCase();
  const groupName = option.groupName.toLowerCase();
  const gid = option.gid.toString();
  
  return groupName.includes(searchText) || gid.includes(searchText);
};

const filterUserOption = (input, option) => {
  const searchText = input.toLowerCase();
  const username = option.username.toLowerCase();
  const uid = option.uid.toString();
  
  return username.includes(searchText) || uid.includes(searchText);
};

const filterProblemOption = (input, option) => {
  const searchText = input.toLowerCase();
  const title = option.title.toLowerCase();
  const pid = option.pid.toString();
  const pgid = option.pgid.toString();
  
  return title.includes(searchText) || pid.includes(searchText) || pgid.includes(searchText);
};

// 获取名称显示函数
const getGroupName = (gid) => {
  const group = groupOptions.value.find(item => item.gid === gid);
  return group ? `${gid} / ${group.groupName}` : gid;
};

const getUserName = (uid) => {
  const user = userOptions.value.find(item => item.uid === uid);
  return user ? `${uid} / ${user.username}` : uid;
};

const getProblemName = (pid) => {
  const problem = problemOptions.value.find(item => item.pid === pid);
  return problem ? `G${problem.pgid} / ${pid} / ${problem.title}` : pid;
};

// 获取状态标签颜色
const getStatusColor = (status) => {
  const colorMap = {
    1: 'success',
    2: 'error',
    3: 'processing',
    4: 'warning',
    5: 'error',
    6: 'default',
    7: 'cyan'
  };
  return colorMap[status] || 'default';
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 事件处理函数
const handleSearch = () => {
  queryParams.value.page = 1;
  fetchAnswerLogs();
};

const handleReset = () => {
  queryParams.value = {
    gid: [],
    uid: [],
    pid: [],
    status: [],
    answer: '',
    order: 0,
    page: 1
  };
  fetchAnswerLogs();
};

const handleTableChange = (pag) => {
  queryParams.value.page = pag.current;
  fetchAnswerLogs();
};

// 设置筛选条件函数
const setGroupFilter = (gid) => {
  queryParams.value.gid = [gid];
};

const setUserFilter = (uid) => {
  queryParams.value.uid = [uid];
};

const setProblemFilter = (pid) => {
  queryParams.value.pid = [pid];
};

onMounted(() => {
  fetchSelectItems();
  fetchAnswerLogs();
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

.filter-link {
  color: black;
  cursor: pointer;
}

.filter-link:hover {
  color: #082741;
}

</style> 