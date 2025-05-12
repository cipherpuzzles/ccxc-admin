<template>
  <div class="page-container">
    <h1>登录记录</h1>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <a-form :model="queryParams">
        <div class="form-content">
          <div class="form-left">
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
            
            <a-form-item label="登录状态">
              <a-select
                v-model:value="queryParams.status"
                mode="multiple"
                placeholder="请选择登录状态"
                style="min-width: 200px"
              >
                <a-select-option v-for="(label, value) in loginStatusMap" :key="Number(value)" :value="Number(value)">
                  {{ label }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="Email">
              <a-input v-model:value="queryParams.email" placeholder="请输入Email" allow-clear />
            </a-form-item>

            <a-form-item label="登录IP">
              <a-input v-model:value="queryParams.ip" placeholder="请输入IP" allow-clear />
            </a-form-item>

            <a-form-item label="UserID">
              <a-input v-model:value="queryParams.userid" placeholder="请输入UserID" allow-clear />
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

    <!-- 登录记录列表 -->
    <a-table
      :columns="columns"
      :data-source="logList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <!-- 自定义列内容 -->
      <template #bodyCell="{ column, record }">
        <!-- 登录时间 -->
        <template v-if="column.key === 'create_time'">
          {{ formatTime(record.create_time) }}
        </template>

        <!-- IP地址 -->
        <template v-if="column.key === 'ip'">
          <a-tooltip placement="bottom" :title="record.proxy_ip">
            <span>{{ record.ip }}</span>
          </a-tooltip>
        </template>

        <!-- UserID -->
        <template v-if="column.key === 'userid'">
          <a-tooltip placement="bottom" :title="record.useragent">
            <span>{{ record.userid }}</span>
          </a-tooltip>
        </template>

        <!-- 登录状态 -->
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ loginStatusMap[record.status] }}
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
import { getLoginLogs } from '@/api/log';
import { getLightUserList } from '@/api/user';

// 登录状态映射
const loginStatusMap = {
  1: '登录成功',
  2: '请求无效',
  3: '用户名错误',
  4: '密码错误',
  5: '无权限',
  6: '二次验证成功',
  7: '二次验证无Ticket',
  8: '二次验证失败',
  9: '发送密码重置邮件',
  10: '重置密码',
  11: '发送激活邮件',
  12: '邮件激活成功',
  31: '账号未激活'
};

// 查询参数
const queryParams = ref({
  uid: [],
  status: [],
  email: '',
  ip: '',
  userid: '',
  order: 0,
  page: 1
});

// 表格数据
const loading = ref(false);
const logList = ref([]);
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 20,
  showTotal: (total) => `共 ${total} 条记录`
});

// 用户选项
const userOptions = ref([]);

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '登录时间',
    key: 'create_time',
    width: 180,
  },
  {
    title: 'Email',
    dataIndex: 'email',
    width: 200,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 150,
  },
  {
    title: 'IP',
    key: 'ip',
    width: 150,
  },
  {
    title: 'UserID',
    key: 'userid',
    width: 200,
  },
  {
    title: '登录状态',
    key: 'status',
    width: 150,
  }
];

// 获取登录日志列表
const fetchLoginLogs = async () => {
  loading.value = true;
  try {
    const result = await getLoginLogs(queryParams.value);
    logList.value = result.login_log;
    pagination.value = {
      ...pagination.value,
      total: result.total_count,
      current: result.page,
      pageSize: result.page_size
    };
  } catch (error) {
    console.error('获取登录日志失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取用户列表
const fetchUserList = async () => {
  try {
    const result = await getLightUserList();
    userOptions.value = result.uid_item.map(item => ({
      label: `${item.uid} / ${item.user_name}`,
      value: item.uid,
      uid: item.uid,
      username: item.user_name
    }));
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
};

// 用户选项过滤
const filterUserOption = (input, option) => {
  const searchText = input.toLowerCase();
  const username = option.username.toLowerCase();
  const uid = option.uid.toString();
  
  return username.includes(searchText) || uid.includes(searchText);
};

// 获取状态标签颜色
const getStatusColor = (status) => {
  const colorMap = {
    1: 'success',
    2: 'error',
    3: 'error',
    4: 'error',
    5: 'error',
    6: 'success',
    7: 'warning',
    8: 'error',
    9: 'processing',
    10: 'success',
    11: 'processing',
    12: 'success',
    31: 'warning'
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
  fetchLoginLogs();
};

const handleReset = () => {
  queryParams.value = {
    uid: [],
    status: [],
    email: '',
    ip: '',
    userid: '',
    order: 0,
    page: 1
  };
  fetchLoginLogs();
};

const handleTableChange = (pag) => {
  queryParams.value.page = pag.current;
  fetchLoginLogs();
};

onMounted(() => {
  fetchUserList();
  fetchLoginLogs();
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
</style> 