<template>
  <div class="page-container">
    <h1>站内信</h1>

    <!-- 发送站内信区域 -->
    <div class="send-message-container">
      <div class="send-message-form">
        <span class="send-message-label">发送站内信给：</span>
        <a-select
          v-model:value="selectedGroupId"
          style="width: 240px"
          placeholder="请选择队伍"
          show-search
          :options="groupOptions"
          :filter-option="filterGroupOption"
        />
        <a-button type="primary" @click="openMessageDrawer()">打开</a-button>
      </div>
    </div>

    <!-- 站内信记录 -->
    <div class="message-record">
      <h2>站内信记录</h2>
      
      <!-- 筛选条件 -->
      <div class="filter-container">
        <a-form :model="queryParams" layout="inline">
          <a-form-item label="队伍">
            <a-select
              v-model:value="queryParams.gid"
              style="width: 240px"
              placeholder="请选择队伍"
              show-search
              allowClear
              :options="groupOptions"
              :filter-option="filterGroupOption"
            />
          </a-form-item>
          
          <a-form-item label="已读状态">
            <a-select v-model:value="queryParams.read" style="width: 120px">
              <a-select-option :value="0">全部</a-select-option>
              <a-select-option :value="1">已读</a-select-option>
              <a-select-option :value="2">未读</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="方向">
            <a-select v-model:value="queryParams.direction" style="width: 120px">
              <a-select-option :value="0">全部</a-select-option>
              <a-select-option :value="1">发送</a-select-option>
              <a-select-option :value="2">接收</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="时间排序">
            <a-select v-model:value="queryParams.order" style="width: 120px">
              <a-select-option :value="0">最新在前</a-select-option>
              <a-select-option :value="1">最老在前</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch">查询</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
      
      <!-- 站内信列表 -->
      <a-table
        :columns="columns"
        :data-source="messageList"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="mid"
      >
        <!-- 自定义列内容 -->
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <div class="message-status">
              <a-space>
                <span v-if="record.direction === 1">
                  <SendOutlined style="color: #1890ff" /> 发送
                </span>
                <span v-else>
                  <InboxOutlined style="color: #52c41a" /> 接收
                </span>
                <a-tag :color="record.is_read === 1 ? 'default' : 'warning'">
                  {{ record.is_read === 1 ? '已读' : '未读' }}
                </a-tag>
              </a-space>
            </div>
          </template>
          
          <!-- 发送时间 -->
          <template v-if="column.key === 'create_time'">
            {{ formatTime(record.create_time) }}
          </template>
          
          <!-- 队名 -->
          <template v-if="column.key === 'group_name'">
            <a @click="setFilterGroup(record.gid)">{{ record.group_name }}</a>
          </template>
          
          <!-- 发送人 -->
          <template v-if="column.key === 'sender'">
            <div class="sender-info">
              <span>{{ record.user_name }}</span>
              <user-role-tag :role-id="record.roleid" />
            </div>
          </template>
          
          <!-- 内容预览 -->
          <template v-if="column.key === 'content'">
            <div class="message-content-preview">
              {{ record.content }}
            </div>
          </template>
          
          <!-- 操作按钮 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" size="small" @click="openMessageDrawer(record.gid, record.mid)">
                打开
              </a-button>
              
              <a-button 
                v-if="record.is_read === 0" type="primary"
                size="small" 
                @click="handleSetRead(record.mid, 1)"
                :loading="record.markingRead"
              >
                标为已读
              </a-button>
              
              <a-button 
                v-if="record.is_read === 1" 
                size="small" 
                @click="handleSetRead(record.mid, 0)"
                :loading="record.markingRead"
              >
                标为未读
              </a-button>
              
              <a-popconfirm
                title="确定要删除这条站内信吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.mid)"
              >
                <a-button danger size="small" :loading="record.deleting">
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
    
    <!-- 消息抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      title="站内消息"
      placement="right"
      :width="600"
      @close="closeMessageDrawer"
      :footer-style="{ textAlign: 'right', padding: '12px 16px' }"
    >
      <template #extra>
        <a-button @click="refreshGroupMessages">
          <reload-outlined />
        </a-button>
      </template>

      <div v-if="currentGroupId" class="message-drawer-content">
        <!-- 群组信息 -->
        <div class="group-info">
          <h3>{{ getCurrentGroupName() }}</h3>
        </div>

        <!-- 消息区域 -->
        <div 
          ref="messageContainer" 
          class="message-container"
        >
          <div v-if="groupMessageList.length === 0" class="no-message">
            <p>暂无消息记录</p>
          </div>
          
          <template v-else>
            <div 
              v-for="(msg, index) in groupMessageList" 
              :key="msg.mid"
              :id="`message-${msg.mid}`"
              :class="[
                'message-item', 
                msg.direction === 1 ? 'message-sent' : 'message-received',
                highlightedMid === msg.mid ? 'message-highlighted' : ''
              ]"
            >
              <!-- 消息头部 -->
              <div class="message-header">
                <div class="sender-info">
                  <span class="sender-name">{{ msg.user_name }}</span>
                  <user-role-tag :role-id="msg.roleid" />
                </div>
                <span class="message-time">{{ formatTime(msg.create_time) }}</span>
              </div>
              
              <!-- 消息气泡 -->
              <div class="message-bubble">
                <markdown-renderer :content="msg.content" />
              </div>
              
              <!-- 消息状态 -->
              <div class="message-status">
                <a-tag :color="msg.is_read === 1 ? 'default' : 'warning'" size="small">
                  {{ msg.is_read === 1 ? '已读' : '未读' }}
                </a-tag>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区域 -->
        <div class="message-input-area">
          <div class="input-actions">
            <div class="action-buttons">
              <a-tooltip title="上传图片">
                <a-button @click="showImageUploader">
                  <picture-outlined />
                </a-button>
              </a-tooltip>
              <a-tooltip title="扩大编辑">
                <a-button @click="showMessageEditor">
                  <expand-outlined />
                </a-button>
              </a-tooltip>
            </div>
            
            <!-- 正在查看的用户标签 -->
            <div v-if="currentViewers.length > 0" class="awareness-tags">
              <span class="awareness-label">正在查看：</span>
              <a-tag
                v-for="user in currentViewers"
                :key="user.id"
                :style="{
                  backgroundColor: user.color,
                  color: adjustTextColor(user.color),
                  border: `1px solid ${user.color}`,
                  margin: '0 4px 0 0'
                }"
                size="small"
              >
                <template v-if="user.typing">
                  ✏️ {{ user.name }}
                </template>
                <template v-else>
                  {{ user.name }}
                </template>
              </a-tag>
            </div>
          </div>
          
          <div class="input-container">
            <a-textarea
              v-model:value="messageInput"
              placeholder="请输入消息内容..."
              :auto-size="{ minRows: 3, maxRows: 6 }"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
            />
            
            <a-button 
              type="primary" 
              class="send-button" 
              :disabled="!messageInput.trim()" 
              :loading="sending"
              @click="sendGroupMessage"
            >
              发送
            </a-button>
          </div>
        </div>
      </div>
      
      <div v-else class="message-drawer-empty">
        <p>请选择队伍查看消息</p>
      </div>
    </a-drawer>

    <!-- 图片上传对话框 -->
    <a-modal
      v-model:open="uploaderVisible"
      title="上传图片"
      width="800px"
      :footer="null"
    >
      <ImageUploader />
    </a-modal>

    <!-- 消息编辑对话框 -->
    <a-modal
      v-model:open="editorVisible"
      title="编辑消息"
      width="800px"
      :footer="null"
      @cancel="closeMessageEditor"
    >
      <div class="monaco-container">
        <MonacoEditor
          v-model:value="messageInput"
          language="markdown"
          :height="400"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SendOutlined, 
  InboxOutlined, 
  PictureOutlined, 
  ReloadOutlined,
  ExpandOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { 
  getGroupNameList, 
  getMessageList, 
  getGroupMessages,
  sendMessage,
  setMessageRead, 
  deleteMessage 
} from '@/api/message';
import UserRoleTag from '@/components/UserRoleTag.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import ySyncDocs from '@/lib/preview/ySyncDocs';
import { useUserStore } from '@/stores/user';
import { adjustTextColor } from '@/lib/preview/utils';

const userStore = useUserStore();

// 队伍选择
const selectedGroupId = ref(undefined);
const groupOptions = ref([]);
const currentGroupId = ref(0);

// 抽屉控制
const drawerVisible = ref(false);

// 查询参数
const queryParams = ref({
  gid: undefined,
  read: 2,
  order: 0,
  direction: 2, // 默认选择"接收"
  page: 1
});

//同步感知
const syncData = reactive({
  aware: [] //感知数据 {color: "#013EB3", gid: 1241, name: "用户名", typing: false} 
  // color为主题色，gid为当前激活的队伍ID，name为当前用户名，typing为是否正在输入。设置感知数据的时候只需要设置gid和typing。
});

// 表格数据
const loading = ref(false);
const messageList = ref([]);
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 20,
  showTotal: (total) => `共 ${total} 条记录`
});

// 表格列定义
const columns = [
  {
    title: '状态',
    key: 'status',
    width: 150,
  },
  {
    title: '发送时间',
    key: 'create_time',
    width: 180,
  },
  {
    title: '队名',
    key: 'group_name',
    dataIndex: 'group_name',
    width: 150,
  },
  {
    title: '发送人',
    key: 'sender',
    width: 150,
  },
  {
    title: '内容',
    key: 'content',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  }
];

// 抽屉内容相关状态
const groupMessageList = ref([]);
const messageInput = ref('');
const sending = ref(false);
const messageContainer = ref(null);
const uploaderVisible = ref(false);
const editorVisible = ref(false);
const highlightedMid = ref(null);

// 输入框焦点状态
const isInputFocused = ref(false);

// 当前正在查看的用户（过滤同一个 gid 的用户）
const currentViewers = computed(() => {
  if (!currentGroupId.value) return [];
  
  return syncData.aware.filter(user => 
    user.gid === currentGroupId.value
  );
});

// 获取队伍列表
const fetchGroupList = async () => {
  try {
    const result = await getGroupNameList();
    if (result.group_name_list && Array.isArray(result.group_name_list)) {
      groupOptions.value = result.group_name_list.map(item => ({
        label: `${item.gid} / ${item.groupname}`,
        value: item.gid,
        gid: item.gid,
        group_name: item.groupname
      }));
    }
  } catch (error) {
    console.error('获取队伍列表失败:', error);
  }
};

// 获取站内信列表
const fetchMessageList = async () => {
  loading.value = true;
  try {
    const result = await getMessageList(queryParams.value);
    messageList.value = result.messages.map(item => ({
      ...item,
      markingRead: false,
      deleting: false
    }));
    pagination.value = {
      ...pagination.value,
      total: result.total_count,
      current: result.page,
      pageSize: result.page_size
    };
  } catch (error) {
    console.error('获取站内信列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 过滤队伍选项
const filterGroupOption = (input, option) => {
  const searchText = input.toLowerCase();
  const groupName = option.group_name.toLowerCase();
  const gid = option.gid.toString();
  
  return groupName.includes(searchText) || gid.includes(searchText);
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 获取当前选中队伍名称
const getCurrentGroupName = () => {
  if (!currentGroupId.value) return '';
  const group = groupOptions.value.find(item => item.gid === currentGroupId.value);
  return group ? `${group.gid} / ${group.group_name}` : `队伍 ${currentGroupId.value}`;
};

// 事件处理函数
const handleSearch = () => {
  queryParams.value.page = 1;
  fetchMessageList();
};

const handleReset = () => {
  queryParams.value = {
    gid: undefined,
    read: 2,
    order: 0,
    direction: 2, // 重置为默认值"接收"
    page: 1
  };
  fetchMessageList();
};

const handleTableChange = (pag) => {
  queryParams.value.page = pag.current;
  fetchMessageList();
};

// 获取队伍消息记录
const fetchGroupMessages = async (gid) => {
  if (!gid) return;
  
  try {
    const result = await getGroupMessages(gid);
    groupMessageList.value = result.messages || [];
    
    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('获取队伍消息记录失败:', error);
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

// 发送消息给队伍
const sendGroupMessage = async () => {
  if (!messageInput.value.trim() || !currentGroupId.value) return;
  
  sending.value = true;
  try {
    await sendMessage(currentGroupId.value, messageInput.value);
    messageInput.value = '';
    await fetchGroupMessages(currentGroupId.value);
  } catch (error) {
    console.error('发送消息失败:', error);
  } finally {
    sending.value = false;
  }
};

// 显示图片上传器
const showImageUploader = () => {
  uploaderVisible.value = true;
};

// 显示消息编辑器
const showMessageEditor = () => {
  editorVisible.value = true;
};

// 关闭消息编辑器
const closeMessageEditor = () => {
  editorVisible.value = false;
  // 关闭编辑器时取消输入状态
  if (currentGroupId.value) {
    ySyncDocs.setAwarenessState("message_aware", { 
      gid: currentGroupId.value, 
      typing: false 
    });
  }
};

// 标记消息为已读
const markMessageAsRead = async (mid) => {
  try {
    await setMessageRead(mid, 1);
    // 更新本地消息状态
    const msgIndex = groupMessageList.value.findIndex(msg => msg.mid === mid);
    if (msgIndex !== -1) {
      groupMessageList.value[msgIndex].is_read = 1;
    }
  } catch (error) {
    console.error('标记消息为已读失败:', error);
  }
};

// 打开消息抽屉
const openMessageDrawer = (gid, mid) => {
  currentGroupId.value = gid || selectedGroupId.value;
  if (!currentGroupId.value) {
    message.warning('请先选择一个队伍');
    return;
  }
  
  drawerVisible.value = true;
  
  // 设置感知状态
  ySyncDocs.setAwarenessState("message_aware", { 
    gid: currentGroupId.value, 
    typing: false 
  });
  fetchGroupMessages(currentGroupId.value).then(() => {
    if (mid) {
      // 查找对应的消息
      const openedMessage = messageList.value.find(item => item.mid === mid);
      
      // 如果是未读的接收消息，自动标记为已读
      if (openedMessage && openedMessage.direction === 0 && openedMessage.is_read === 0) {
        handleSetRead(mid, 1);
      }
      
      // 高亮显示并滚动到对应位置
      highlightedMid.value = mid;
      nextTick(() => {
        const element = document.getElementById(`message-${mid}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // 设置高亮效果，并在一段时间后取消
          setTimeout(() => {
            highlightedMid.value = null;
          }, 3000);
        }
      });
    }
  });
};

// 关闭消息抽屉
const closeMessageDrawer = () => {
  drawerVisible.value = false;
  // 清空数据
  groupMessageList.value = [];
  messageInput.value = '';
  highlightedMid.value = null;
};

// 监听抽屉状态，关闭时清理数据
watch(() => drawerVisible.value, (isOpen) => {
  if (!isOpen) {
    // 取消感知状态
    ySyncDocs.removeAwarenessState("message_aware");
    
    // 抽屉关闭时清空数据
    groupMessageList.value = [];
    messageInput.value = '';
    highlightedMid.value = null;
    isInputFocused.value = false;
  }
});

// 标记列表中消息读取状态
const handleSetRead = async (mid, type) => {
  const target = messageList.value.find(item => item.mid === mid);
  if (target) {
    target.markingRead = true;
    try {
      const result = await setMessageRead(mid, type);
      if (result.status === 1) {
        const actionText = type === 1 ? '已读' : '未读';
        message.success(`标记为${actionText}成功`);
        // 更新本地数据状态
        target.is_read = type;
      }
    } catch (error) {
      const actionText = type === 1 ? '已读' : '未读';
      console.error(`标记${actionText}失败:`, error);
    } finally {
      target.markingRead = false;
    }
  }
};

// 删除站内信
const handleDelete = async (mid) => {
  const target = messageList.value.find(item => item.mid === mid);
  if (target) {
    target.deleting = true;
    try {
      const result = await deleteMessage(mid);
      if (result.status === 1) {
        message.success('删除站内信成功');
        // 从列表中移除该条记录
        messageList.value = messageList.value.filter(item => item.mid !== mid);
      }
    } catch (error) {
      console.error('删除站内信失败:', error);
    } finally {
      target.deleting = false;
    }
  }
};

// 刷新队伍消息
const refreshGroupMessages = () => {
  if (currentGroupId.value) {
    fetchGroupMessages(currentGroupId.value);
  }
};

// 设置过滤队伍
const setFilterGroup = (gid) => {
  queryParams.value.gid = gid;
};

// 输入框焦点事件处理
const handleInputFocus = () => {
  isInputFocused.value = true;
  if (currentGroupId.value) {
    ySyncDocs.setAwarenessState("message_aware", { 
      gid: currentGroupId.value, 
      typing: true 
    });
  }
};

const handleInputBlur = () => {
  isInputFocused.value = false;
  if (currentGroupId.value) {
    ySyncDocs.setAwarenessState("message_aware", { 
      gid: currentGroupId.value, 
      typing: false 
    });
  }
};

// 监听消息输入变化，判断是否正在输入
let typingTimer = null;
watch(() => messageInput.value, () => {
  if (!currentGroupId.value || !isInputFocused.value) return;
  
  // 清除之前的定时器
  if (typingTimer) {
    clearTimeout(typingTimer);
  }
  
  // 设置正在输入状态
  ySyncDocs.setAwarenessState("message_aware", { 
    gid: currentGroupId.value, 
    typing: true 
  });
  
  // 设置定时器，1秒后如果没有新的输入则设为不在输入
  typingTimer = setTimeout(() => {
    if (currentGroupId.value && isInputFocused.value) {
      ySyncDocs.setAwarenessState("message_aware", { 
        gid: currentGroupId.value, 
        typing: false 
      });
    }
  }, 1000);
});

onMounted(() => {
  //连接ySync
  ySyncDocs.userInfo = userStore;
  ySyncDocs.connect(userStore.token, "adminTags").then(() => {
    console.log("ySync 连接成功");
  }).catch((err) => {
    console.error("ySync 连接失败", err);
  });

  fetchGroupList();
  fetchMessageList();

  //初始化感知
  ySyncDocs.registerAwarenessFunc("message_aware", (aware) => {
    syncData.aware = aware;
  });
});

onBeforeUnmount(() => {
  ySyncDocs.removeAwarenessState("message_aware");
  ySyncDocs.unregisterAwarenessFunc("message_aware");
  ySyncDocs.disconnect();
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

h2 {
  margin: 24px 0 16px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 18px;
}

.send-message-container {
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.send-message-form {
  display: flex;
  align-items: center;
  gap: 16px;
}

.send-message-label {
  font-weight: 500;
}

.filter-container {
  margin-bottom: 24px;
  padding: 24px;
  background: #fafafa;
  border-radius: 4px;
}

.message-content-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

a {
  color: #1890ff;
  cursor: pointer;
}

a:hover {
  color: #40a9ff;
}

/* 消息抽屉样式 */
.message-drawer-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
}

.message-drawer-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.group-info {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  margin-bottom: 16px;
}

.no-message {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.message-item {
  margin-bottom: 24px;
  max-width: 80%;
}

.message-received {
  align-self: flex-start;
  margin-right: auto;
}

.message-sent {
  align-self: flex-end;
  margin-left: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-name {
  font-weight: 500;
}

.message-time {
  color: #999;
  font-size: 12px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f2f2f2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-sent .message-bubble {
  background-color: #e6f7ff;
}

.message-status {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.message-highlighted {
  animation: highlight 3s ease;
}

@keyframes highlight {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(250, 219, 20, 0.2);
  }
}

.message-input-area {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 感知标签样式 */
.awareness-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.awareness-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.awareness-tags .ant-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.input-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.input-container :deep(.ant-input) {
  resize: none;
}

.send-button {
  margin-top: 8px;
}

.monaco-container {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
</style> 