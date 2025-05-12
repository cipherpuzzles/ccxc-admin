<template>
  <div class="uploader-container">
    <!-- 上传类型选择 -->
    <div class="upload-type">
      <a-radio-group v-model:value="uploadType" button-style="solid">
        <a-radio-button :value="0">上传原文件</a-radio-button>
        <a-radio-button :value="1">处理图片（推荐）</a-radio-button>
      </a-radio-group>
    </div>

    <!-- 上传区域 -->
    <div
      class="upload-area"
      @click="triggerFileInput"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect"
      >
      <upload-outlined />
      <p>点击或拖拽文件到此处上传</p>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list">
      <div class="list-header">
        <a-button @click="clearList">清除列表</a-button>
        <div class="batch-actions">
          <a-button type="primary" @click="batchCopyMD">批量复制MD</a-button>
          <a-button style="margin-left: 8px" @click="batchCopyURL">批量复制URL</a-button>
        </div>
      </div>

      <div class="list-content">
        <div v-for="file in fileList" :key="file.id" class="file-item">
          <!-- 上传中 -->
          <template v-if="!file.url">
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <a-progress :percent="file.progress" size="small" />
            </div>
          </template>
          
          <!-- 上传完成 -->
          <template v-else>
            <div class="file-info">
              <div class="file-url">{{ file.url }}</div>
              <div class="file-actions">
                <a-button type="link" @click="copyMD(file)">复制MD</a-button>
                <a-button type="link" @click="copyURL(file)">复制URL</a-button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { getUploadToken, uploadFile } from '@/api/upload';

// 上传类型
const uploadType = ref(1);
const fileInput = ref(null);
const fileList = ref([]);

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  uploadFiles(files);
  event.target.value = ''; // 清除input，允许重复选择相同文件
};

// 处理拖拽
const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files);
  uploadFiles(files);
};

// 上传文件
const uploadFiles = async (files) => {
  for (const file of files) {
    const fileId = generateId();
    const fileItem = {
      id: fileId,
      name: file.name,
      progress: 0
    };
    fileList.value.push(fileItem);

    try {
      // 1. 获取上传token
      const { upload_token } = await getUploadToken(uploadType.value);

      // 2. 上传文件
      const { image_path } = await uploadFile(file, upload_token, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const index = fileList.value.findIndex(item => item.id === fileId);
          if (index !== -1) {
            fileList.value[index].progress = progress;
          }
        }
      });

      // 3. 更新文件状态
      const index = fileList.value.findIndex(item => item.id === fileId);
      if (index !== -1) {
        fileList.value[index] = {
          ...fileList.value[index],
          url: image_path
        };
      }
    } catch (error) {
      message.error(`上传失败: ${file.name}`);
      const index = fileList.value.findIndex(item => item.id === fileId);
      if (index !== -1) {
        fileList.value.splice(index, 1);
      }
    }
  }
};

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch (err) {
    message.error('复制失败');
  }
};

// 复制MD格式
const copyMD = (file) => {
  copyToClipboard(`![img](${file.url})`);
};

// 复制URL
const copyURL = (file) => {
  copyToClipboard(file.url);
};

// 批量复制MD
const batchCopyMD = () => {
  const urls = fileList.value
    .filter(file => file.url)
    .map(file => `![img](${file.url})`)
    .join('\n');
  copyToClipboard(urls);
};

// 批量复制URL
const batchCopyURL = () => {
  const urls = fileList.value
    .filter(file => file.url)
    .map(file => file.url)
    .join('\n');
  copyToClipboard(urls);
};

// 清除列表
const clearList = () => {
  fileList.value = [];
};
</script>

<style scoped>
.uploader-container {
  padding: 16px;
}

.upload-type {
  margin-bottom: 16px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #1890ff;
}

.upload-area p {
  margin: 8px 0 0;
  color: rgba(0, 0, 0, 0.45);
}

.file-list {
  margin-top: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.file-item {
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  color: rgba(0, 0, 0, 0.85);
  flex: 1;
  margin-right: 16px;
}

.file-url {
  color: #1890ff;
  flex: 1;
  margin-right: 16px;
  word-break: break-all;
}

.file-actions {
  white-space: nowrap;
}
</style> 