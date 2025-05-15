<template>
  <div class="page-container">
    <h1>系统设置</h1>

    <a-spin :spinning="loading">
      <!-- 第一部分：项目设置 -->
      <div class="setting-section">
        <h2>项目设置</h2>
        <div class="form-content">
          <a-form :model="formData" layout="vertical">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="项目名称">
                  <a-input v-model:value="formData.ProjectName" placeholder="请输入项目名称" />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="开赛时间">
                  <a-date-picker 
                    v-model:value="startDateTime" 
                    :show-time="{ format: 'HH:mm:ss' }" 
                    format="YYYY-MM-DD HH:mm:ss" 
                    style="width: 100%"
                    @change="onStartTimeChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="结束时间">
                  <a-date-picker 
                    v-model:value="endDateTime" 
                    :show-time="{ format: 'HH:mm:ss' }" 
                    format="YYYY-MM-DD HH:mm:ss" 
                    style="width: 100%"
                    @change="onEndTimeChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="项目前端地址前缀">
                  <a-input 
                    v-model:value="formData.ProjectFrontendPrefix" 
                    placeholder="请输入项目前端地址前缀（URL）" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="题目独立前端前缀">
                  <a-input 
                    v-model:value="formData.GamePrefix" 
                    placeholder="请输入题目独立前端前缀（不要以 / 结尾）" 
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </div>

      <!-- 第二部分：系统功能 -->
      <div class="setting-section">
        <h2>系统功能</h2>
        <div class="form-content">
          <a-form :model="formData" layout="vertical">
            <a-row :gutter="24">
              <a-col :span="8">
                <a-form-item label="用户Session有效期（秒）">
                  <a-input-number 
                    v-model:value="formData.UserSessionTimeout" 
                    :min="0" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="是否显示题目解析">
                  <a-switch 
                    :checked="formData.ShowAnalysis === 1" 
                    @change="val => formData.ShowAnalysis = val ? 1 : 0"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="是否打开访客模式">
                  <a-switch 
                    :checked="formData.EnableGuestMode === 1" 
                    @change="val => formData.EnableGuestMode = val ? 1 : 0"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </div>

      <!-- 第三部分：AI智能补全 -->
      <div class="setting-section">
        <h2>AI智能补全</h2>
        <p class="description-text">在编写题目脚本时启用AI智能补全</p>
        <div class="form-content">
          <a-form :model="formData" layout="vertical">
            <a-row :gutter="24">
              <a-col :span="24">
                <a-form-item label="是否启用AI智能补全">
                  <a-switch 
                    :checked="formData.AdminAiEnable === 1" 
                    @change="val => formData.AdminAiEnable = val ? 1 : 0"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="AI调用的API地址">
                  <a-input 
                    v-model:value="formData.AdminAiApiUrl" 
                    placeholder="填写以 /v1 结尾的URL，例如 https://api.openai.com/v1" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="AI调用的模型">
                  <a-input 
                    v-model:value="formData.AdminAiApiModel" 
                    placeholder="请输入AI调用的模型" 
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="AI调用的API密钥 (为了保证密钥安全，保存后不会再回显)">
                  <a-input 
                    v-model:value="apiKeyInput" 
                    :placeholder="formData.AdminAiApiKey ? formData.AdminAiApiKey : '请输入API密钥'"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </div>

      <div class="form-actions">
        <a-button type="primary" @click="saveSettings" :loading="saving">
          保存设置
        </a-button>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getSystemOptions, updateSystemOptions } from '@/api/setting';

// 数据加载状态
const loading = ref(true);
const saving = ref(false);

// 表单数据
const formData = ref({
  ProjectName: '',
  StartTime: 0,
  EndTime: 0,
  ProjectFrontendPrefix: '',
  GamePrefix: '',
  UserSessionTimeout: 0,
  ShowAnalysis: 0,
  EnableGuestMode: 0,
  AdminAiEnable: 0,
  AdminAiApiUrl: '',
  AdminAiApiKey: '',
  AdminAiApiModel: ''
});

// API密钥输入值
const apiKeyInput = ref('');

// 日期时间选择器的值
const startDateTime = ref(null);
const endDateTime = ref(null);

// 日期时间变更处理函数
const onStartTimeChange = (value) => {
  if (value) {
    formData.value.StartTime = value.valueOf(); // 转换为毫秒时间戳
  } else {
    formData.value.StartTime = 0;
  }
};

const onEndTimeChange = (value) => {
  if (value) {
    formData.value.EndTime = value.valueOf(); // 转换为毫秒时间戳
  } else {
    formData.value.EndTime = 0;
  }
};

// 加载系统设置
const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await getSystemOptions();
    formData.value = res.config;
    
    // 将时间戳转换为dayjs对象用于日期选择器
    if (formData.value.StartTime > 0) {
      startDateTime.value = dayjs(parseInt(formData.value.StartTime));
    }
    if (formData.value.EndTime > 0) {
      endDateTime.value = dayjs(parseInt(formData.value.EndTime));
    }
  } catch (error) {
    console.error('加载系统设置失败:', error);
    message.error('加载系统设置失败');
  } finally {
    loading.value = false;
  }
};

// 保存系统设置
const saveSettings = async () => {
  saving.value = true;
  try {
    // 确保数值类型字段为数字
    const submitData = {
      ...formData.value,
      UserSessionTimeout: Number(formData.value.UserSessionTimeout),
      ShowAnalysis: Number(formData.value.ShowAnalysis),
      EnableGuestMode: Number(formData.value.EnableGuestMode),
      AdminAiEnable: Number(formData.value.AdminAiEnable),
      StartTime: String(formData.value.StartTime),
      EndTime: String(formData.value.EndTime),
      // 处理API密钥，如果用户没有输入，则发送null
      AdminAiApiKey: apiKeyInput.value ? apiKeyInput.value : null
    };
    
    await updateSystemOptions(submitData);
    message.success('保存系统设置成功');
  } catch (error) {
    console.error('保存系统设置失败:', error);
    message.error('保存系统设置失败');
  } finally {
    saving.value = false;
  }
};

// 页面加载时初始化数据
onMounted(() => {
  loadSettings();
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
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 18px;
}

.setting-section {
  margin-bottom: 32px;
  padding: 24px;
  background: #fafafa;
  border-radius: 4px;
}

.form-content {
  margin-bottom: 16px;
}

.form-actions {
  margin-top: 24px;
}

.description-text {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.65);
}
</style> 