<template>
  <div class="page-container">
    <h1>题目文章</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-button type="primary" @click="showEditModal()">
        <plus-outlined /> 新建文章
      </a-button>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchPuzzleArticleList">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 文章列表 -->
    <a-table
      :columns="columns"
      :data-source="puzzleArticleList"
      :loading="loading"
      row-key="paid"
      :pagination="false"
    >
      <!-- 发布时间 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          <div>{{ formatTime(record.dt_create) }}</div>
          <div v-if="record.dt_update && record.dt_update > 0" class="update-time">更新于: {{ formatTime(record.dt_update) }}</div>
        </template>

        <!-- 标题 -->
        <template v-if="column.key === 'title'">
          <div>
            {{ record.title }}
            <a-tooltip v-if="record.is_hide === 1" title="隐藏文章">
              <lock-outlined style="margin-left: 5px" />
            </a-tooltip>
          </div>
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这篇文章吗？"
              @confirm="handleDelete(record.paid)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 编辑模态框 -->
    <a-modal
      :open="modalVisible"
      :title="currentArticle.paid ? '编辑文章' : '新建文章'"
      @ok="handleSave"
      @cancel="confirmCloseModal"
      :maskClosable="false"
      :keyboard="false"
      :closeOnEsc="false"
      width="1200px"
    >
      <template #footer>
        <div class="modal-footer">
          <div class="modal-left-buttons">
            <a-button type="link" @click="saveToLocalStorage">
              暂存
            </a-button>
            <span v-if="lastSavedTime">上次自动保存: {{ lastSavedTime }}</span>
          </div>
          <div class="modal-buttons">
            <a-button @click="confirmCloseModal">取消</a-button>
            <a-button type="primary" @click="handleSave">提交</a-button>
          </div>
        </div>
      </template>

      <a-form :model="currentArticle" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="关键字" required>
              <a-input
                v-model:value="currentArticle.key"
                placeholder="填写用于后端程序识别的关键字"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="标题" required>
              <a-input v-model:value="currentArticle.title" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <div class="form-item-with-action">
            <a-checkbox v-model:checked="currentArticle.is_hide">隐藏此文章</a-checkbox>
            <div>
              <a-radio-group v-model:value="editorMode" button-style="solid">
                <a-radio-button value="markdown">Markdown</a-radio-button>
                <a-radio-button value="html">HTML</a-radio-button>
              </a-radio-group>
              <a-tooltip title="上传图片" placement="right">
                <a-button @click="showImageUploader" style="margin-left: 8px">
                  <picture-outlined />
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="文章内容">
          <div class="editor-container">
            <MonacoEditor
              v-model:value="currentArticle.content"
              :language="editorMode"
              :height="400"
              :theme="editorMode === 'html' ? 'vs-dark' : 'vs'"
            />
            <a-button class="expand-btn" @click="expandEditor">
              <fullscreen-outlined />
            </a-button>
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
    
    <!-- 编辑器全屏模式 -->
    <div v-if="editorFullscreen" class="fullscreen-editor">
      <div class="fullscreen-header">
        <div class="title">正在编辑 {{ currentArticle.title || '新文章' }}</div>
        <a-button class="close-btn" @click="editorFullscreen = false">
          <close-outlined />
        </a-button>
      </div>
      <div class="fullscreen-content">
        <MonacoEditor
          v-model:value="currentArticle.content"
          :language="editorMode"
          :height="fullscreenEditorHeight"
          :theme="editorMode === 'html' ? 'vs-dark' : 'vs'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined, PictureOutlined, ReloadOutlined, LockOutlined, FullscreenOutlined, CloseOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import MonacoEditor from '@/components/MonacoEditor.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import {
  getPuzzleArticleList,
  addPuzzleArticle,
  editPuzzleArticle,
  deletePuzzleArticle
} from '@/api/puzzleArticle';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'paid',
    width: 80,
  },
  {
    title: '关键字',
    dataIndex: 'key',
    width: 150,
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '发布时间',
    key: 'time',
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
const puzzleArticleList = ref([]);
const modalVisible = ref(false);
const currentArticle = ref({
  paid: null,
  key: '',
  title: '',
  content: '',
  is_hide: false
});

// 自动保存状态
const autoSaveKey = 'puzzle_article_autosave';
const lastSavedTime = ref('');
const autoSaveTimer = ref(null);

// 图片上传器状态
const uploaderVisible = ref(false);

// 编辑器状态
const editorMode = ref('markdown');
const editorFullscreen = ref(false);
const fullscreenEditorHeight = computed(() => {
  return window.innerHeight - 70; // 减去头部高度
});

// 获取文章列表
const fetchPuzzleArticleList = async () => {
  loading.value = true;
  try {
    const result = await getPuzzleArticleList();
    puzzleArticleList.value = result.puzzle_articles || [];
  } catch (error) {
    console.error('获取题目文章列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 显示编辑模态框
const showEditModal = (record = null) => {
  // 先检查是否有自动保存的数据
  const savedData = localStorage.getItem(autoSaveKey);
  
  if (record) {
    // 编辑现有文章
    currentArticle.value = {
      paid: record.paid,
      key: record.key,
      title: record.title,
      content: record.content,
      is_hide: record.is_hide === 1
    };
    
    // 尝试检测编辑器模式
    if (record.content.includes('<') && record.content.includes('>')) {
      editorMode.value = 'html';
    } else {
      editorMode.value = 'markdown';
    }
  } else {
    // 如果是新建文章，检查是否有自动保存的草稿
    if (savedData && !record) {
      Modal.confirm({
        title: '发现自动保存的草稿',
        content: '是否要恢复上次自动保存的内容？',
        okText: '恢复',
        cancelText: '不恢复',
        onOk: () => {
          try {
            const parsedData = JSON.parse(savedData);
            currentArticle.value = parsedData.article;
            editorMode.value = parsedData.mode;
            message.success('已恢复自动保存的内容');
          } catch (error) {
            console.error('解析自动保存数据失败:', error);
            resetCurrentArticle();
          }
        },
        onCancel: () => {
          resetCurrentArticle();
          // 清除自动保存的数据
          localStorage.removeItem(autoSaveKey);
        }
      });
    } else {
      resetCurrentArticle();
    }
  }
  
  // 启动自动保存
  startAutoSave();
  
  modalVisible.value = true;
};

// 重置当前文章为默认值
const resetCurrentArticle = () => {
  currentArticle.value = {
    paid: null,
    key: '',
    title: '',
    content: '',
    is_hide: false
  };
  editorMode.value = 'markdown';
};

// 启动自动保存
const startAutoSave = () => {
  // 先清除之前的定时器
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
  }
  
  // 每30秒自动保存一次
  autoSaveTimer.value = setInterval(() => {
    saveToLocalStorage();
  }, 30000);
};

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
};

// 保存到本地存储
const saveToLocalStorage = () => {
  try {
    localStorage.setItem(autoSaveKey, JSON.stringify({
      article: currentArticle.value,
      mode: editorMode.value
    }));
    const now = new Date();
    lastSavedTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('自动保存失败:', error);
  }
};

// 显示图片上传器
const showImageUploader = () => {
  uploaderVisible.value = true;
};

// 扩展编辑器
const expandEditor = () => {
  editorFullscreen.value = true;
};

// 保存文章
const handleSave = async () => {
  try {
    const { paid, key, title, content, is_hide } = currentArticle.value;
    
    // 验证必填字段
    if (!key.trim()) {
      message.error('关键字不能为空');
      return;
    }
    
    if (!title.trim()) {
      message.error('标题不能为空');
      return;
    }
    
    // 转换布尔值为数字
    const isHideNum = is_hide ? 1 : 0;
    
    if (paid) {
      // 编辑现有文章
      await editPuzzleArticle(paid, key, title, content, isHideNum);
      message.success('编辑文章成功');
    } else {
      // 创建新文章
      await addPuzzleArticle(key, title, content, isHideNum);
      message.success('新建文章成功');
    }
    
    modalVisible.value = false;
    // 清除自动保存
    stopAutoSave();
    localStorage.removeItem(autoSaveKey);
    fetchPuzzleArticleList();
  } catch (error) {
    console.error('保存文章失败:', error);
  }
};

// 删除文章
const handleDelete = async (paid) => {
  try {
    await deletePuzzleArticle(paid);
    message.success('删除文章成功');
    fetchPuzzleArticleList();
  } catch (error) {
    console.error('删除文章失败:', error);
  }
};

// 关闭确认
const confirmCloseModal = () => {
  // 阻止默认的关闭行为，显示确认对话框
  Modal.confirm({
    title: '确认关闭',
    content: '您确定要关闭编辑窗口吗？未保存的内容将会丢失。',
    okText: '确认关闭',
    cancelText: '继续编辑',
    onOk: () => {
      // 用户确认关闭后再设置modalVisible=false
      modalVisible.value = false;
      // 清除自动保存
      stopAutoSave();
      localStorage.removeItem(autoSaveKey);
    }
  });
  // 返回false防止对话框关闭
  return false;
};

onMounted(() => {
  fetchPuzzleArticleList();
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

.form-item-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-container {
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.expand-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 全屏编辑器样式 */
.fullscreen-editor {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #1e1e1e;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  height: 50px;
  background-color: #252525;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #303030;
}

.fullscreen-header .title {
  font-size: 16px;
  font-weight: 500;
}

.fullscreen-content {
  flex: 1;
  overflow: hidden;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
}

/* 模态框底部样式 */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-left-buttons {
  display: flex;
  gap: 8px;
}

.modal-left-buttons>span {
  font-size: 12px;
  line-height: 32px;
  color: rgba(0, 0, 0, 0.45);
}

.modal-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style> 