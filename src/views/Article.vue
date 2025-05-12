<template>
  <div class="page-container">
    <h1>站内文章</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-button type="primary" @click="showEditModal()">
        <plus-outlined /> 新建文章
      </a-button>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchArticleList">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 文章列表 -->
    <a-table
      :columns="columns"
      :data-source="articleList"
      :loading="loading"
      row-key="aid"
    >
      <!-- 发布时间 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          <div>{{ formatTime(record.dt_create) }}</div>
          <div class="update-time">更新于: {{ formatTime(record.dt_update) }}</div>
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这篇文章吗？"
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
      :title="currentArticle.aid ? '编辑文章' : '新建文章'"
      @ok="handleSave"
      @cancel="handleCancel"
      width="1200px"
    >
      <a-form :model="currentArticle" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="排序" required>
              <a-input-number
                v-model:value="currentArticle.order"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="访问路径" required>
              <a-input
                v-model:value="currentArticle.path"
                placeholder="请仅使用英文、数字和-"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="标题" required>
              <a-input v-model:value="currentArticle.title" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <div class="form-item-with-action">
            <a-checkbox v-model:checked="currentArticle.is_hide">隐藏此文章</a-checkbox>
            <a-tooltip title="上传图片" placement="right">
              <a-button @click="showImageUploader">
                <picture-outlined />
              </a-button>
            </a-tooltip>
          </div>
        </a-form-item>

        <a-form-item label="文章内容" required>
          <div class="monaco-container">
            <MonacoEditor
              v-model:value="currentArticle.content"
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
  getArticleList,
  addArticle,
  editArticle,
  deleteArticle
} from '@/api/article';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'aid',
    width: 80,
  },
  {
    title: '排序',
    dataIndex: 'order',
    width: 80,
  },
  {
    title: '路径',
    dataIndex: 'path',
    width: 150,
  },
  {
    title: '发布时间',
    key: 'time',
    width: 200,
  },
  {
    title: '标题',
    dataIndex: 'title',
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
const articleList = ref([]);
const modalVisible = ref(false);
const currentArticle = ref({
  aid: null,
  order: 0,
  title: '',
  path: '',
  content: '',
  is_hide: false
});

// 图片上传器状态
const uploaderVisible = ref(false);

// 获取文章列表
const fetchArticleList = async () => {
  loading.value = true;
  try {
    const result = await getArticleList();
    articleList.value = result.articles;
  } catch (error) {
    console.error('获取文章列表失败:', error);
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
  if (record) {
    currentArticle.value = {
      aid: record.aid,
      order: record.order,
      title: record.title,
      path: record.path,
      content: record.content,
      is_hide: record.is_hide === 1
    };
  } else {
    currentArticle.value = {
      aid: null,
      order: 0,
      title: '',
      path: '',
      content: '',
      is_hide: false
    };
  }
  modalVisible.value = true;
};

// 保存文章
const handleSave = async () => {
  try {
    const { aid, order, title, path, content, is_hide } = currentArticle.value;
    const isHideNum = is_hide ? 1 : 0;
    
    if (!title.trim()) {
      message.error('文章标题不能为空');
      return;
    }
    
    if (!path.trim()) {
      message.error('访问路径不能为空');
      return;
    }
    
    if (!content.trim()) {
      message.error('文章内容不能为空');
      return;
    }

    if (aid) {
      await editArticle(aid, order, title, path, content, isHideNum);
      message.success('编辑文章成功');
    } else {
      await addArticle(order, title, path, content, isHideNum);
      message.success('新建文章成功');
    }

    modalVisible.value = false;
    fetchArticleList();
  } catch (error) {
    console.error('保存文章失败:', error);
  }
};

// 删除文章
const handleDelete = async (aid) => {
  try {
    await deleteArticle(aid);
    message.success('删除文章成功');
    fetchArticleList();
  } catch (error) {
    console.error('删除文章失败:', error);
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
  fetchArticleList();
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

.monaco-container {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.form-item-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 