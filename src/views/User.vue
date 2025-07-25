<template>
  <div class="page-container">
    <h1>用户管理</h1>
    
    <!-- 筛选条件 -->
    <div class="filter-container">
      <a-form layout="inline" :model="queryParams">
        <a-form-item label="在线状态">
          <a-select v-model:value="queryParams.is_online" style="width: 120px">
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">在线</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="queryParams.username" placeholder="请输入用户名" allow-clear />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="queryParams.email" placeholder="请输入邮箱" allow-clear />
        </a-form-item>
        <a-form-item label="测试用户">
          <a-select v-model:value="queryParams.is_beta_user" style="width: 120px">
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">测试用户</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 用户列表 -->
    <a-table
      :columns="columns"
      :data-source="userList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="uid"
    >
      <!-- 用户名和简介 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'username'">
          <a-tooltip placement="top">
            <template #title>
              <div class="user-detail-tooltip">
                <p><strong>手机号码：</strong>{{ record.phone || '未设置' }}</p>
                <p><strong>创建时间：</strong>{{ formatTime(record.create_time) }}</p>
                <p><strong>更新时间：</strong>{{ formatTime(record.update_time) }}</p>
                <p><strong>个人简介：</strong></p>
                <p class="full-profile">{{ record.profile || '暂无简介' }}</p>
              </div>
            </template>
            <div>{{ record.username }}</div>
            <div class="user-profile">{{ record.profile }}</div>
          </a-tooltip>
        </template>
        
        <!-- 用户角色 -->
        <template v-else-if="column.key === 'role'">
          <div>
            <a-space>
              <user-role-tag :role-id="record.roleid" />
              <a-tooltip v-if="record.is_beta_user" title="内测用户">
                <crown-outlined class="beta-icon" />
              </a-tooltip>
            </a-space>
            <div 
              v-if="record.gid && record.gid !== 0 && record.groupname" 
              class="group-name"
              @click="handleGoToGroup(record.gid)"
              :title="record.groupname"
            >
              {{ record.groupname.length > 10 ? record.groupname.substring(0, 9) + '...' : record.groupname }}
            </div>
          </div>
        </template>

        <!-- 在线状态 -->
        <template v-else-if="column.key === 'status'">
          <div>
            <a-tag :color="isUserOnline(record.last_action_time) ? 'success' : 'default'">
              {{ isUserOnline(record.last_action_time) ? '在线' : '离线' }}
            </a-tag>
          </div>
          <div v-if="record.last_action_time >= 0" class="last-action-time">
            上次活动: {{ formatTime(record.last_action_time) }}
          </div>
        </template>

        <!-- 操作按钮 -->
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button
              :type="record.roleid === -1 ? 'primary' : 'danger'"
              size="small"
              @click="handleBanUser(record)"
            >
              {{ record.roleid === -1 ? '取消封禁' : '封禁' }}
            </a-button>
            <a-button
              :type="record.is_beta_user ? 'default' : 'primary'"
              size="small"
              @click="handleSetBetaUser(record)"
            >
              {{ record.is_beta_user ? '取消内测' : '设为内测' }}
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { CrownOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { 
  getUserList, 
  setBetaUser, 
  removeBetaUser,
  setBanUser,
  removeBanUser
} from '@/api/user';
import UserRoleTag from '@/components/UserRoleTag.vue';

const router = useRouter();

// 查询参数
const queryParams = ref({
  is_online: 0,
  username: '',
  email: '',
  is_beta_user: 0,
  page_num: 1,
  page_size: 20
});

// 表格数据
const loading = ref(false);
const userList = ref([]);
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 20
});

// 表格列定义
const columns = [
  {
    title: 'UID',
    dataIndex: 'uid',
    width: 80,
  },
  {
    title: '用户名',
    key: 'username',
    width: 200,
  },
  {
    title: '用户角色',
    key: 'role',
    width: 120,
  },
  {
    title: '在线状态',
    key: 'status',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
  }
];

// 获取用户列表数据
const fetchUserList = async () => {
  loading.value = true;
  try {
    const result = await getUserList(queryParams.value);
    userList.value = result.users;
    pagination.value = {
      ...pagination.value,
      total: result.sum_rows,
      current: queryParams.value.page_num,
      pageSize: queryParams.value.page_size
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 判断用户是否在线
const isUserOnline = (lastActionTime) => {
  if (lastActionTime < 0) return false;
  return Date.now() - lastActionTime <= 5 * 60 * 1000;
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 事件处理函数
const handleSearch = () => {
  queryParams.value.page_num = 1;
  fetchUserList();
};

const handleReset = () => {
  queryParams.value = {
    is_online: 0,
    username: '',
    email: '',
    is_beta_user: 0,
    page_num: 1,
    page_size: 20
  };
  fetchUserList();
};

const handleTableChange = (pag) => {
  queryParams.value.page_num = pag.current;
  queryParams.value.page_size = pag.pageSize;
  fetchUserList();
};

const handleBanUser = async (record) => {
  try {
    const { status } = record.roleid === -1
      ? await removeBanUser(record.uid)
      : await setBanUser(record.uid);
    
    if (status === 1) {
      message.success(record.roleid === -1 ? '取消封禁成功' : '封禁成功');
      fetchUserList();
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleSetBetaUser = async (record) => {
  try {
    const { status } = record.is_beta_user
      ? await removeBetaUser(record.uid)
      : await setBetaUser(record.uid);
    
    if (status === 1) {
      message.success(record.is_beta_user ? '取消内测用户成功' : '设置内测用户成功');
      fetchUserList();
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleGoToGroup = (gid) => {
  router.push({
    name: 'group',
    query: { gid }
  });
};

onMounted(() => {
  fetchUserList();
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
}

.user-profile {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.last-action-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.user-detail-tooltip {
  max-width: 600px;
}

.user-detail-tooltip p {
  margin-bottom: 8px;
  white-space: normal;
}

.user-detail-tooltip .full-profile {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #1890ff;
  white-space: pre-wrap;
  word-break: break-all;
}

.beta-icon {
  color: #faad14;
  cursor: help;
}

.group-name {
  cursor: pointer;
  color: #1890ff;
  font-size: 12px;
  margin-top: 4px;
  transition: color 0.2s;
}

.group-name:hover {
  color: #40a9ff;
  text-decoration: underline;
}
</style> 