<template>
  <div class="page-container">
    <h1>成员管理</h1>
    
    <!-- 操作栏 -->
    <div class="filter-container">
      <a-form layout="inline">
        <a-form-item label="选择用户">
          <a-select
            v-model:value="selectedUid"
            show-search
            placeholder="请选择用户"
            :filter-option="filterOption"
            style="width: 250px"
            :options="userOptions"
          />
        </a-form-item>
        <a-form-item label="设置角色">
          <a-radio-group v-model:value="selectedRole" button-style="solid">
            <a-radio-button :value="4">出题组成员</a-radio-button>
            <a-radio-button :value="5">管理员</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSetRole" :disabled="!selectedUid">设置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 成员列表 -->
    <a-table
      :columns="columns"
      :data-source="organizerList"
      :loading="loading"
      :pagination="false"
      row-key="uid"
    >
      <!-- 用户名和简介 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'username'">
          <a-tooltip placement="top">
            <template #title>
              <div class="user-detail-tooltip">
                <p><strong>个人简介：</strong></p>
                <p class="full-profile">{{ record.profile || '暂无简介' }}</p>
              </div>
            </template>
            <div>{{ record.username }}</div>
            <div v-if="record.profile" class="user-profile">{{ record.profile }}</div>
          </a-tooltip>
        </template>
        
        <!-- 用户角色 -->
        <template v-else-if="column.key === 'role'">
          <a-space>
            <user-role-tag :role-id="record.roleid" />
            <a-tooltip v-if="record.is_beta_user" title="内测用户">
              <crown-outlined class="beta-icon" />
            </a-tooltip>
          </a-space>
        </template>

        <!-- 操作按钮 -->
        <template v-else-if="column.key === 'action'">
          <a-button type="danger" size="small" @click="handleRevokeRole(record)">
            取消成员权限
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 设置角色确认对话框 -->
    <a-modal
      v-model:visible="confirmModalVisible"
      title="确认操作"
      :ok-text="confirmOkText"
      cancel-text="取消"
      @ok="confirmSetRole"
    >
      <p>{{ confirmMessage }}</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { CrownOutlined } from '@ant-design/icons-vue';
import UserRoleTag from '@/components/UserRoleTag.vue';
import { 
  getLightUserList,
  getOrganizerList,
  setOrganizerRole
} from '@/api/user';

// 数据
const loading = ref(false);
const organizerList = ref([]);
const userList = ref([]);
const selectedUid = ref(undefined);
const selectedRole = ref(4);
const confirmModalVisible = ref(false);
const currentAction = ref(null);
const currentRecord = ref(null);

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
    title: '操作',
    key: 'action',
    width: 150,
  }
];

// 用户下拉选项
const userOptions = computed(() => {
  return userList.value.map(user => ({
    value: user.uid,
    label: `${user.uid} / ${user.user_name}`
  }));
});

// 下拉框过滤方法
const filterOption = (input, option) => {
  return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
};

// 确认框文本
const confirmMessage = computed(() => {
  if (currentAction.value === 'set') {
    const selectedUser = userList.value.find(user => user.uid === selectedUid.value);
    const roleName = selectedRole.value === 4 ? '出题组成员' : '管理员';
    return `即将授予用户 UID:${selectedUser?.uid} ${selectedUser?.user_name} ${roleName} 权限，是否继续？设置后用户将从当前组队移除并注销所有登录状态。`;
  } else {
    const roleName = currentRecord.value?.roleid === 4 ? '出题组成员' : '管理员';
    return `即将取消用户 UID:${currentRecord.value?.uid} ${currentRecord.value?.username} 的 ${roleName} 权限，是否继续？设置后用户将从当前组队移除并注销所有登录状态。`;
  }
});

const confirmOkText = computed(() => {
  return currentAction.value === 'set' ? '设置' : '取消权限';
});

// 获取用户和组织者列表数据
const fetchUserList = async () => {
  try {
    const result = await getLightUserList();
    userList.value = result.uid_item;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
};

const fetchOrganizerList = async () => {
  loading.value = true;
  try {
    const result = await getOrganizerList();
    organizerList.value = result.data;
  } catch (error) {
    console.error('获取组织者列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 事件处理函数
const handleSetRole = () => {
  if (!selectedUid.value) return;
  
  currentAction.value = 'set';
  confirmModalVisible.value = true;
};

const handleRevokeRole = (record) => {
  currentAction.value = 'revoke';
  currentRecord.value = record;
  confirmModalVisible.value = true;
};

const confirmSetRole = async () => {
  try {
    let uid, roleid;
    
    if (currentAction.value === 'set') {
      uid = selectedUid.value;
      roleid = selectedRole.value;
    } else {
      uid = currentRecord.value.uid;
      roleid = 1; // 取消成员权限，设为普通用户
    }
    
    const { status } = await setOrganizerRole(uid, roleid);
    
    if (status === 1) {
      message.success(currentAction.value === 'set' ? '设置成员权限成功' : '取消成员权限成功');
      fetchOrganizerList();
      selectedUid.value = undefined;
    }
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    confirmModalVisible.value = false;
  }
};

onMounted(() => {
  fetchUserList();
  fetchOrganizerList();
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
</style> 