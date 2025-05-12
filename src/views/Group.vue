<template>
  <div class="page-container">
    <h1>组队管理</h1>
    
    <!-- 筛选条件 -->
    <div class="filter-container">
      <a-space>
        <a-radio-group v-model:value="queryParams.order" button-style="solid">
          <a-radio-button :value="0">默认排序</a-radio-button>
          <a-radio-button :value="1">综合进度排序</a-radio-button>
        </a-radio-group>
        
        <a-input
          v-model:value="queryParams.groupname"
          placeholder="请输入组队名称"
          style="width: 200px"
          allow-clear
        />
        
        <a-button type="primary" @click="fetchGroupList">
          查询
        </a-button>
        
        <a-button @click="resetQuery">
          重置
        </a-button>
      </a-space>
    </div>

    <!-- 组队列表 -->
    <a-table
      :columns="columns"
      :data-source="groupList"
      :loading="loading"
      :pagination="false"
      row-key="gid"
    >
      <!-- 队名和简介 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'groupname'">
          <div class="group-name-container">
            <div class="member-count-tag">
              {{ record.member_count }}
            </div>
            <div class="group-info">
              <div>{{ record.groupname }}</div>
              <div v-if="record.profile" class="group-profile">{{ record.profile }}</div>
            </div>
          </div>
        </template>

        <!-- 完成情况 -->
        <template v-if="column.key === 'progress'">
          <div>解锁情况：{{ record.unlock_p1_count }} 分区 {{ record.unlock_p2_count }} 小题</div>
          <div>完成情况：{{ record.finish_p1_count }} 分区 {{ record.finish_p2_count }} 小题 {{ record.finish_meta_count }} Meta</div>
        </template>

        <!-- 完赛状态 -->
        <template v-if="column.key === 'status'">
          <div :class="['status-container', record.is_finish ? 'finished' : 'unfinished']">
            <span>{{ record.is_finish ? '已完赛' : '未完赛' }}</span>
            <eye-invisible-outlined v-if="record.is_hide" class="hide-icon" />
          </div>
          <div v-if="record.is_finish" class="finish-time">
            完赛时间：{{ formatTime(record.finish_time) }}
          </div>
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-button type="link" @click="handleViewDetail(record)">
            详情
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <a-pagination
        v-model:current="queryParams.page_num"
        v-model:pageSize="queryParams.page_size"
        :total="total"
        show-size-changer
        show-quick-jumper
        @change="handlePageChange"
        @showSizeChange="handleSizeChange"
      />
    </div>

    <!-- 组队详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :width="drawerWidth"
      placement="right"
      :closable="true"
      @close="closeDrawer"
    >
      <template v-if="currentGroupDetail">
        <!-- 基本信息 -->
        <div class="group-detail-header">
          <h2>{{ currentGroup?.groupname }}</h2>
          <div class="group-meta">
            <span>GID: {{ currentGroup?.gid }}</span>
            <span v-if="currentGroup?.create_time > 0">
              创建时间: {{ formatTime(currentGroup?.create_time) }}
            </span>
          </div>
        </div>

        <!-- 题目完成情况 -->
        <div class="problem-progress">
          <h3>题目完成情况</h3>
          <div 
            v-for="group in groupedProblems" 
            :key="group.pgid"
            class="problem-group"
          >
            <!-- 分区标签 -->
            <div 
              class="group-tag"
              :class="getGroupStatusClass(group.pgid)"
            >
              {{ group.pgid }}
            </div>

            <!-- 题目列表 -->
            <div class="problem-list">
              <a-tooltip
                v-for="problem in group.item"
                :key="problem.pid"
                placement="bottom"
              >
                <template v-slot:title>
                  <div v-html="getProblemTooltip(problem)"></div>
                </template>
                <div 
                  class="problem-tag"
                  :class="getProblemStatusClass(problem.pid)"
                >
                  {{ problem.pid }}
                </div>
              </a-tooltip>
            </div>
          </div>
        </div>

        <!-- 队员列表 -->
        <div class="team-members">
          <h3>队员列表</h3>
          <div class="member-list">
            <div 
              v-for="user in currentGroupDetail.users" 
              :key="user.uid"
              class="member-item"
            >
              <span class="member-uid">UID: {{ user.uid }}</span>
              <span class="member-name">{{ user.username }}</span>
              <UserRoleTag :role-id="user.roleid" />
            </div>
          </div>
        </div>

        <!-- 队伍操作区域 -->
        <div class="team-operations">
          <h3>队伍操作</h3>
          
          <!-- 信用点调整 -->
          <div class="operation-item">
            <span class="operation-label">信用点调整：</span>
            <div class="operation-control">
              <a-input-number
                v-model:value="powerPointValue"
                :precision="0"
                placeholder="输入整数（负数代表扣除）"
                style="width: 240px"
              />
              <a-button type="primary" @click="handleUpdatePowerPoint" :loading="powerPointLoading">
                确定
              </a-button>
            </div>
            <span class="operation-desc">输入负数代表扣除</span>
          </div>
          
          <!-- 队伍隐藏状态 -->
          <div class="operation-item">
            <span class="operation-label">隐藏队伍：</span>
            <div class="operation-control">
              <a-switch
                v-model:checked="hideStatusValue"
                :loading="hideStatusLoading"
                @change="handleUpdateHideStatus"
              />
              <span class="status-desc">{{ hideStatusValue ? '已隐藏' : '未隐藏' }}</span>
            </div>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { EyeInvisibleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getGroupOverview, getProblemList, getGroupDetail, addGroupPowerPoint, updateGroupHideStatus } from '@/api/group';
import UserRoleTag from '@/components/UserRoleTag.vue';

// 表格列定义
const columns = [
  {
    title: 'GID',
    dataIndex: 'gid',
    width: 80,
  },
  {
    title: '队名',
    key: 'groupname',
    ellipsis: true,
  },
  {
    title: '完成情况',
    key: 'progress',
    width: 250,
  },
  {
    title: '信用点',
    dataIndex: 'power_point',
    width: 100,
  },
  {
    title: '完赛状态',
    key: 'status',
    width: 220,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center'
  }
];

// 查询参数
const queryParams = ref({
  order: 1,
  groupname: '',
  page_num: 1,
  page_size: 10
});

// 数据状态
const loading = ref(false);
const groupList = ref([]);
const total = ref(0);
const problemList = ref([]);
const drawerVisible = ref(false);
const currentGroup = ref(null);
const currentGroupDetail = ref(null);

// 操作状态
const powerPointValue = ref(0);
const powerPointLoading = ref(false);
const hideStatusValue = ref(false);
const hideStatusLoading = ref(false);

// 计算抽屉宽度
const drawerWidth = computed(() => {
  return window.innerWidth < 720 ? '100vw' : '50vw';
});

// 将题目按分区分组
const groupedProblems = computed(() => {
  const groups = {};
  problemList.value.forEach(problem => {
    if (!groups[problem.pgid]) {
      groups[problem.pgid] = {
        pgid: problem.pgid,
        item: []
      };
    }
    groups[problem.pgid].item.push(problem);
  });
  return Object.values(groups).sort((a, b) => a.pgid - b.pgid);
});

// 获取分区状态类名
const getGroupStatusClass = (pgid) => {
  const progress = currentGroupDetail.value?.progress?.data;
  if (!progress) return 'status-locked';
  
  if (progress.FinishedGroups.includes(pgid)) return 'status-finished';
  if (progress.UnlockedGroups.includes(pgid)) return 'status-unlocked';
  return 'status-locked';
};

// 获取题目状态类名
const getProblemStatusClass = (pid) => {
  const progress = currentGroupDetail.value?.progress?.data;
  if (!progress) return 'status-locked';
  
  if (progress.FinishedProblems.includes(pid)) return 'status-finished';
  if (progress.UnlockedProblems.includes(pid)) return 'status-unlocked';
  return 'status-locked';
};

// 获取题目工具提示内容
const getProblemTooltip = (problem) => {
  const progress = currentGroupDetail.value?.progress?.data;
  if (!progress) return problem.title;

  const unlockTime = progress.ProblemUnlockTime[problem.pid];
  const submissions = progress.ProblemAnswerSubmissionsCount[problem.pid] || 0;
  const additional = progress.AdditionalProblemAttemptsCount[problem.pid] || 0;
  const hints = progress.OpenedHints[problem.pid] || [];

  return `
    ${problem.title}<br>
    ${unlockTime ? `解锁时间: ${formatTime(new Date(unlockTime))}` : '未解锁'}<br>
    错误次数: ${submissions}<br>
    额外次数: ${additional}<br>
    ${hints.length ? `已开放提示: ${hints.join(', ')}` : ''}
  `;
};

// 获取组队列表
const fetchGroupList = async () => {
  loading.value = true;
  try {
    const result = await getGroupOverview(
      queryParams.value.order,
      queryParams.value.groupname,
      queryParams.value.page_num,
      queryParams.value.page_size
    );
    groupList.value = result.groups;
    total.value = result.sum_rows;
  } catch (error) {
    console.error('获取组队列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取题目列表
const fetchProblemList = async () => {
  try {
    const result = await getProblemList();
    problemList.value = result.pid_item;
  } catch (error) {
    console.error('获取题目列表失败:', error);
  }
};

// 获取组队详情
const fetchGroupDetail = async (gid) => {
  try {
    const result = await getGroupDetail(gid);
    currentGroupDetail.value = result;
    
    // 初始化队伍隐藏状态
    hideStatusValue.value = currentGroup.value.is_hide === 1;
  } catch (error) {
    console.error('获取组队详情失败:', error);
  }
};

// 处理行点击
const handleViewDetail = (record) => {
  currentGroup.value = record;
  drawerVisible.value = true;
  fetchGroupDetail(record.gid);
};

// 关闭抽屉
const closeDrawer = () => {
  drawerVisible.value = false;
  currentGroup.value = null;
  currentGroupDetail.value = null;
};

// 重置查询条件
const resetQuery = () => {
  queryParams.value = {
    order: 1,
    groupname: '',
    page_num: 1,
    page_size: 10
  };
  fetchGroupList();
};

// 分页变化
const handlePageChange = (page, pageSize) => {
  queryParams.value.page_num = page;
  queryParams.value.page_size = pageSize;
  fetchGroupList();
};

// 每页条数变化
const handleSizeChange = (current, size) => {
  queryParams.value.page_num = 1;
  queryParams.value.page_size = size;
  fetchGroupList();
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 处理信用点更新
const handleUpdatePowerPoint = async () => {
  if (!currentGroup.value) return;
  
  powerPointLoading.value = true;
  try {
    await addGroupPowerPoint(currentGroup.value.gid, powerPointValue.value);
    message.success('信用点调整成功');
    
    // 刷新组队列表和详情
    fetchGroupList();
    fetchGroupDetail(currentGroup.value.gid);
    
    // 重置输入值
    powerPointValue.value = 0;
  } catch (error) {
    console.error('信用点调整失败:', error);
  } finally {
    powerPointLoading.value = false;
  }
};

// 处理隐藏状态更新
const handleUpdateHideStatus = async (value) => {
  if (!currentGroup.value) return;
  
  hideStatusLoading.value = true;
  try {
    await updateGroupHideStatus(currentGroup.value.gid, value ? 1 : 0);
    message.success(`${value ? '隐藏' : '显示'}队伍成功`);
    
    // 刷新组队列表
    fetchGroupList();
  } catch (error) {
    console.error('更新队伍隐藏状态失败:', error);
    // 恢复原值
    hideStatusValue.value = !value;
  } finally {
    hideStatusLoading.value = false;
  }
};

onMounted(() => {
  fetchGroupList();
  fetchProblemList();
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
  margin-bottom: 16px;
}

.group-profile {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unfinished {
  color: rgba(0, 0, 0, 0.45);
}

.finished {
  color: #52c41a;
}

.hide-icon {
  color: rgba(0, 0, 0, 0.45);
}

.finish-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.pagination-container {
  margin-top: 16px;
  text-align: right;
}

/* 抽屉样式 */
.group-detail-header {
  margin-bottom: 24px;
}

.group-detail-header h2 {
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.group-meta {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.group-meta span {
  margin-right: 16px;
}

.problem-progress {
  margin-bottom: 24px;
}

.problem-group {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.group-tag,
.problem-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.problem-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: 16px;
}

.status-finished {
  background-color: #b7eb8f;
  color: #135200;
}

.status-unlocked {
  background-color: #91caff;
  color: #002c8c;
}

.status-locked {
  background-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.45);
}

.team-members {
  margin-top: 24px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-uid {
  color: rgba(0, 0, 0, 0.45);
  min-width: 80px;
}

.member-name {
  color: rgba(0, 0, 0, 0.85);
  margin-right: auto;
}

.group-name-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.member-count-tag {
  background-color: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.65);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.team-operations {
  margin-top: 32px;
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.operation-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.operation-label {
  width: 100px;
  color: rgba(0, 0, 0, 0.85);
}

.operation-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-desc {
  color: rgba(0, 0, 0, 0.45);
  margin-left: 10px;
}

.status-desc {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.45);
}
</style> 