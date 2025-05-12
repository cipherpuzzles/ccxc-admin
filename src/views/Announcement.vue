<template>
  <div class="page-container">
    <h1>公告管理</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-button type="primary" @click="showEditModal()">
        <plus-outlined /> 新建公告
      </a-button>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchAnnouncementList">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 公告列表 -->
    <a-table
      :columns="columns"
      :data-source="announcementList"
      :loading="loading"
      row-key="aid"
    >
      <!-- 发布时间 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          <div>{{ formatTime(record.create_time) }}</div>
          <div class="update-time">更新于: {{ formatTime(record.update_time) }}</div>
        </template>

        <!-- 公告内容 -->
        <template v-if="column.key === 'content'">
          <a-tooltip :title="record.content">
            <div class="content-preview">{{ getFirstLine(record.content) }}</div>
          </a-tooltip>
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这条公告吗？"
              @confirm="handleDelete(record.aid)"
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
      :title="currentAnnouncement.aid ? '编辑公告' : '新建公告'"
      @ok="handleSave"
      @cancel="handleCancel"
      width="1200px"
    >
      <a-form :model="currentAnnouncement" layout="vertical">
        <a-form-item>
          <div class="form-item-with-action">
            <a-checkbox v-model:checked="currentAnnouncement.is_hide">隐藏此公告</a-checkbox>
            <a-tooltip title="上传图片" placement="right">
              <a-button @click="showImageUploader">
                <picture-outlined />
              </a-button>
            </a-tooltip>
          </div>
        </a-form-item>
        <a-form-item>
          <div class="monaco-container">
            <MonacoEditor
              v-model:value="currentAnnouncement.content"
              language="markdown"
              :height="400"
            />
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片上传对话框 -->
    <a-modal
      v-model:open="uploaderVisible"
      title="上传图片"
      width="800px"
      :footer="null"
    >
      <ImageUploader />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, PictureOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import MonacoEditor from '@/components/MonacoEditor.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import {
  getAnnouncementList,
  addAnnouncement,
  editAnnouncement,
  deleteAnnouncement
} from '@/api/announcement';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'aid',
    width: 80,
  },
  {
    title: '发布时间',
    key: 'time',
    width: 200,
  },
  {
    title: '内容',
    key: 'content',
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
const announcementList = ref([]);
const modalVisible = ref(false);
const currentAnnouncement = ref({
  aid: null,
  content: '',
  is_hide: false
});

// 图片上传器状态
const uploaderVisible = ref(false);

// 获取公告列表
const fetchAnnouncementList = async () => {
  loading.value = true;
  try {
    const result = await getAnnouncementList();
    announcementList.value = result.announcements;
  } catch (error) {
    console.error('获取公告列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 获取内容的第一行
const getFirstLine = (content) => {
  const firstLine = content.split('\n')[0] || '';
  return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
};

// 显示编辑模态框
const showEditModal = (record = null) => {
  if (record) {
    currentAnnouncement.value = {
      aid: record.aid,
      content: record.content,
      is_hide: record.is_hide === 1
    };
  } else {
    currentAnnouncement.value = {
      aid: null,
      content: '',
      is_hide: false
    };
  }
  modalVisible.value = true;
};

// 保存公告
const handleSave = async () => {
  try {
    const { aid, content, is_hide } = currentAnnouncement.value;
    const isHideNum = is_hide ? 1 : 0;
    
    if (!content.trim()) {
      message.error('公告内容不能为空');
      return;
    }

    if (aid) {
      await editAnnouncement(aid, content, isHideNum);
      message.success('编辑公告成功');
    } else {
      await addAnnouncement(content, isHideNum);
      message.success('新建公告成功');
    }

    modalVisible.value = false;
    fetchAnnouncementList();
  } catch (error) {
    console.error('保存公告失败:', error);
  }
};

// 删除公告
const handleDelete = async (aid) => {
  try {
    await deleteAnnouncement(aid);
    message.success('删除公告成功');
    fetchAnnouncementList();
  } catch (error) {
    console.error('删除公告失败:', error);
  }
};

// 取消编辑
const handleCancel = () => {
  modalVisible.value = false;
};

// 显示图片上传器
const showImageUploader = () => {
  uploaderVisible.value = true;
};

onMounted(() => {
  fetchAnnouncementList();
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

.update-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.monaco-container {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.editor-toolbar {
  margin-bottom: 8px;
}

.form-item-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 