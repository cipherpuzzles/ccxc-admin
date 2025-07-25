<template>
  <div class="page-container">
    <h1>题目管理</h1>
    
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <div class="left-buttons">
        <a-button type="primary" @click="showEditModal()">
          <plus-outlined /> 新建题目
        </a-button>
        <a-button type="warning" class="swap-pid-btn" @click="showSwapModal">
          PID交换
        </a-button>
      </div>
      <a-tooltip title="刷新列表">
        <a-button @click="fetchPuzzleList">
          <reload-outlined />
        </a-button>
      </a-tooltip>
    </div>

    <!-- 题目列表 -->
    <a-table
      :columns="columns"
      :data-source="puzzleList"
      :loading="loading"
      row-key="pid"
      :row-class-name="getRowClassName"
      :pagination="false"
    >
      <!-- 表格列自定义渲染 -->
      <template #bodyCell="{ column, record }">
        <!-- 所属分区 -->
        <template v-if="column.key === 'pgid'">
          <div>
            {{ getPuzzleGroupName(record.pgid) }}
            <a-tooltip title="隐藏分区">
              <lock-outlined v-if="isPuzzleGroupHidden(record.pgid)" style="margin-left: 5px" />
            </a-tooltip>
          </div>
        </template>

        <!-- 题目类型 -->
        <template v-if="column.key === 'answer_type'">
          {{ getAnswerTypeName(record.answer_type) }}
        </template>

        <!-- 操作按钮 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这个题目吗？"
              @confirm="handleDelete(record.pid)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- PID交换对话框 -->
    <a-modal
      v-model:open="swapModalVisible"
      title="PID交换"
      @ok="handleSwapPids"
      @cancel="swapModalVisible = false"
    >
      <div class="swap-container">
        <a-select
          v-model:value="swapInfo.pid1"
          style="width: 45%"
          placeholder="选择第一个题目"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="puzzle in puzzleList" :key="puzzle.pid" :value="puzzle.pid">
            {{ puzzle.pid }} / {{ puzzle.title }} / {{ puzzle.answer }}
          </a-select-option>
        </a-select>
        
        <swap-outlined class="swap-icon" />
        
        <a-select
          v-model:value="swapInfo.pid2"
          style="width: 45%"
          placeholder="选择第二个题目"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="puzzle in puzzleList" :key="puzzle.pid" :value="puzzle.pid">
            {{ puzzle.pid }} / {{ puzzle.title }} / {{ puzzle.answer }}
          </a-select-option>
        </a-select>
      </div>
    </a-modal>

    <!-- 编辑模态框 -->
    <a-modal
      :open="modalVisible"
      :title="currentPuzzle.pid ? '编辑题目' : '新建题目'"
      @ok="handleSave"
      @cancel="confirmCloseModal"
      :maskClosable="false"
      :keyboard="false"
      :closeOnEsc="false"
      width="90vw"
    >
      <template #footer>
        <div class="modal-footer">
          <div class="modal-left-buttons">
            <!-- 仅在编辑现有题目时显示的附加功能按钮 -->
            <a-button v-if="currentPuzzle.pid" type="primary" @click="showAdditionalAnswerModal">
              <plus-outlined /> 添加附加答案（里程碑）
            </a-button>
            <a-button v-if="currentPuzzle.pid" type="primary" @click="showTipsModal" style="margin-left: 10px">
              <plus-outlined /> 添加提示
            </a-button>
            <a-button type="link" @click="saveToLocalStorage">
              暂存
            </a-button>
            <span v-if="lastSavedTime">上次自动保存: {{ lastSavedTime }}</span>
          </div>
          <div class="modal-buttons">
            <a-button @click="confirmCloseModal">取消</a-button>
            <a-button @click="handleSave(true)" v-if="currentPuzzle.pid">保存</a-button>
            <a-button type="primary" @click="handleSave(false)">保存并关闭</a-button>
          </div>
        </div>
      </template>
      
      <a-form :model="currentPuzzle" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="标题" required>
              <a-input v-model:value="currentPuzzle.title" placeholder="请输入题目标题" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="所属分区" required>
              <a-select 
                v-model:value="currentPuzzle.pgid" 
                style="width: 100%"
                placeholder="选择题目所属分区"
              >
                <a-select-option 
                  v-for="group in puzzleGroups" 
                  :key="group.pgid" 
                  :value="group.pgid"
                >
                  {{ group.pg_name }}
                  <lock-outlined v-if="group.is_hide === 1" style="margin-left: 5px" />
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="内容类型" required>
              <a-select v-model:value="currentPuzzle.type" style="width: 100%">
                <a-select-option :value="0">题目是图片</a-select-option>
                <a-select-option :value="1">题目是HTML</a-select-option>
                <a-select-option :value="2">题目是VUE SFC</a-select-option>
                <a-select-option :value="3">上传题目模块</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="题目类型" required>
              <a-select v-model:value="currentPuzzle.answer_type" style="width: 100%">
                <a-select-option :value="0">小题</a-select-option>
                <a-select-option :value="1">分区Meta</a-select-option>
                <a-select-option :value="2">MetaMeta</a-select-option>
                <a-select-option :value="3">FinalMeta</a-select-option>
                <a-select-option :value="4">不计分题目</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="题目备注">
              <a-input v-model:value="currentPuzzle.desc" placeholder="列表中显示的备注" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="作者">
              <a-input v-model:value="currentPuzzle.author" placeholder="作者仅在解析中显示" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="附加信息">
              <a-input v-model:value="currentPuzzle.extend_data" placeholder="用于后端程序处理的额外信息" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="题目描述(Flavor Text)">
          <a-textarea 
            v-model:value="currentPuzzle.content" 
            placeholder="可以使用Markdown格式" 
            :auto-size="{ minRows: 3, maxRows: 30 }" 
          />
        </a-form-item>
        <a-form-item label="附加内容(通过后显示)">
          <a-textarea 
            v-model:value="currentPuzzle.extend_content" 
            placeholder="可以使用Markdown格式" 
            :auto-size="{ minRows: 3, maxRows: 30 }" 
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="currentPuzzle.check_answer_type === 1 ? 6 : 12">
            <a-form-item label="答案" required>
              <a-input v-model:value="currentPuzzle.answer" placeholder="题目的答案" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="允许尝试次数" required>
              <a-input-number 
                v-model:value="currentPuzzle.attempts_count" 
                :min="1" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="判题模式" required>
              <a-select v-model:value="currentPuzzle.check_answer_type" style="width: 100%">
                <a-select-option :value="0">标准</a-select-option>
                <a-select-option :value="1">自定义判题函数</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6" v-if="currentPuzzle.check_answer_type === 1">
            <a-form-item label="高级判题脚本名称">
              <a-input 
                v-model:value="currentPuzzle.check_answer_function" 
                placeholder="填入题目脚本中对应的判题脚本的关键字" 
              />
            </a-form-item>
          </a-col>
        </a-row>

        <div class="form-upload-container">
          <a-tooltip title="上传图片">
            <a-button @click="showImageUploader" style="margin-bottom: 10px">
              <picture-outlined />
            </a-button>
          </a-tooltip>
        </div>

        <a-form-item v-if="currentPuzzle.type === 0" label="题目图片">
          <a-input v-model:value="currentPuzzle.image" placeholder="图片URL" />
        </a-form-item>

        <a-form-item v-if="currentPuzzle.type === 1 || currentPuzzle.type === 2" label="题目HTML">
          <div class="editor-container">
            <MonacoEditor
              v-model:value="currentPuzzle.html"
              language="html"
              :height="450"
              theme="vs-dark"
            />
            <a-button class="expand-btn" @click="expandHtmlEditor">
              <fullscreen-outlined />
            </a-button>
          </div>
        </a-form-item>

        <a-form-item v-if="currentPuzzle.type === 2" label="题目脚本">
          <div class="editor-container">
            <MonacoEditor
              v-model:value="currentPuzzle.script"
              language="javascript"
              :height="450"
              theme="vs-dark"
              :isScriptEditor="true"
            />
            <a-button class="expand-btn" @click="expandScriptEditor">
              <fullscreen-outlined />
            </a-button>
          </div>
        </a-form-item>
        
        <a-form-item v-if="currentPuzzle.type === 3" label="题目脚本">
          <div style="display: flex; align-items: center;">
            <a-input v-model:value="currentPuzzle.script" placeholder="题目模块URL" style="flex: 1;" />
            <a-button type="primary" @click="showModuleUploader" style="margin-left: 8px;">
              上传题目模块
            </a-button>
            <a-button type="link" @click="openModuleInstruction" style="margin-left: 8px;">
              题目模块说明
            </a-button>
          </div>
        </a-form-item>

        <a-form-item label="解析">
          <a-textarea 
            v-model:value="currentPuzzle.analysis" 
            placeholder="可以使用Markdown格式" 
            :auto-size="{ minRows: 3, maxRows: 30 }" 
          />
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
    
    <!-- 附加答案(里程碑)对话框 -->
    <a-modal
      v-model:open="additionalAnswerModalVisible"
      title="附加答案(里程碑)管理"
      width="800px"
      :footer="null"
      @cancel="additionalAnswerModalVisible = false"
      :maskClosable="true"
    >
      <div>
        <p>附加答案（里程碑）是题目的额外答案或中间答案。当选手提交此答案时，不会作为错误答案处理，而是返回对应的消息。</p>
        
        <!-- 附加答案表单 -->
        <h3 class="form-status-title">
          {{ currentAdditionalAnswer.aaid ? `正在编辑附加答案 #${currentAdditionalAnswer.aaid}` : '新建附加答案' }}
        </h3>
        <a-form :model="currentAdditionalAnswer" layout="vertical">
          <a-form-item label="附加答案" required>
            <a-input v-model:value="currentAdditionalAnswer.answer" placeholder="输入附加答案" />
          </a-form-item>
          
          <a-form-item label="消息">
            <a-input v-model:value="currentAdditionalAnswer.message" placeholder="当选手提交该答案时显示的消息" />
          </a-form-item>
          
          <a-form-item>
            <template #label>
              <span>
                额外动作
                <a-tooltip placement="right">
                  <template #title>
                    <div>
                      <p>额外动作说明：</p>
                      <p>每个题目都存储一组key-value的状态集合。当选手提交答案时，如果答案匹配到了此附加答案，会根据额外动作的指令去修改这个状态集合。</p>
                      <p>语法：</p>
                      <p>set key value：添加或更新一组key-value值。</p>
                      <p>del key：删除key</p>
                      <p>clear：清空状态集合</p>
                    </div>
                  </template>
                  <question-circle-outlined style="margin-left: 4px" />
                </a-tooltip>
              </span>
            </template>
            <a-input v-model:value="currentAdditionalAnswer.extra" placeholder="输入额外动作" />
          </a-form-item>
          
          <a-form-item>
            <template #label>
              <span>
                不计数
                <a-tooltip placement="right">
                  <template #title>
                    <div>
                      当用户看到附加答案的个数时，不会包括这些答案的数量
                    </div>
                  </template>
                  <question-circle-outlined style="margin-left: 4px" />
                </a-tooltip>
              </span>
            </template>
            <a-checkbox v-model:checked="notCountChecked">
              不计数
            </a-checkbox>
          </a-form-item>
          
          <div class="form-action-buttons">
            <a-button type="primary" @click="handleAdditionalAnswerSubmit">
              提交
            </a-button>
            <a-popconfirm
              title="确定要清空当前输入并重置吗？"
              @confirm="resetAdditionalAnswerForm"
              okText="确定"
              cancelText="取消"
            >
              <a-button style="margin-left: 10px">
                重置(新建)
              </a-button>
            </a-popconfirm>
          </div>
        </a-form>
        
        <!-- 附加答案列表 -->
        <div class="additional-list-container">
          <h3>已有附加答案</h3>
          <a-table
            :columns="additionalAnswerColumns"
            :data-source="additionalAnswers"
            :pagination="false"
            :loading="additionalAnswerLoading"
            rowKey="aaid"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">
                {{ index + 1 }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="handleEditAdditionalAnswer(record)">
                    编辑
                  </a-button>
                  <a-popconfirm
                    title="确定要删除这个附加答案吗？"
                    @confirm="handleDeleteAdditionalAnswer(record.aaid)"
                    okText="确定"
                    cancelText="取消"
                  >
                    <a-button type="link" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>
    
    <!-- 提示管理对话框 -->
    <a-modal
      v-model:open="tipsModalVisible"
      title="提示管理"
      width="800px"
      :footer="null"
      @cancel="tipsModalVisible = false"
      :maskClosable="true"
    >
      <div>
        <!-- 提示表单 -->
        <h3 class="form-status-title">
          {{ currentTip.ptid ? `正在编辑提示 #${currentTip.order}` : '新建提示' }}
        </h3>
        <a-form :model="currentTip" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="排序" required>
                <a-input-number v-model:value="currentTip.order" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="消耗信用点">
                <a-input-number v-model:value="currentTip.point_cost" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="解锁延迟(分钟)">
                <a-input-number v-model:value="currentTip.unlock_delay" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item label="标题" required>
            <a-input v-model:value="currentTip.title" placeholder="提示标题" />
          </a-form-item>
          
          <a-form-item label="内容">
            <a-textarea 
              v-model:value="currentTip.content" 
              placeholder="可以使用Markdown格式" 
              :auto-size="{ minRows: 3, maxRows: 15 }" 
            />
          </a-form-item>
          
          <a-form-item label="备注">
            <a-input v-model:value="currentTip.desc" placeholder="选手无法看到这个备注" />
          </a-form-item>
          
          <div class="form-action-buttons">
            <a-button type="primary" @click="handleTipSubmit">
              提交
            </a-button>
            <a-popconfirm
              title="确定要清空当前输入并重置吗？"
              @confirm="resetTipForm"
              okText="确定"
              cancelText="取消"
            >
              <a-button style="margin-left: 10px">
                重置(新建)
              </a-button>
            </a-popconfirm>
          </div>
        </a-form>
        
        <!-- 提示列表 -->
        <div class="additional-list-container">
          <h3>已有提示</h3>
          <a-table
            :columns="tipsColumns"
            :data-source="tips"
            :pagination="false"
            :loading="tipsLoading"
            rowKey="ptid"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="handleEditTip(record)">
                    编辑
                  </a-button>
                  <a-popconfirm
                    title="确定要删除这个提示吗？"
                    @confirm="handleDeleteTip(record.ptid)"
                    okText="确定"
                    cancelText="取消"
                  >
                    <a-button type="link" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>

    <!-- 模块上传对话框 -->
    <a-modal
      v-model:open="moduleUploaderVisible"
      title="上传题目模块"
      width="800px"
      :footer="null"
    >
      <ModuleUploader @uploaded="handleModuleUploaded" />
    </a-modal>
  </div>
  
  <!-- HTML编辑器全屏模式 -->
  <div v-if="htmlEditorFullscreen" class="fullscreen-editor">
    <div class="fullscreen-header">
      <div class="title">正在编辑 {{ currentPuzzle.title || '新题目' }} HTML</div>
      <a-button class="close-btn" @click="htmlEditorFullscreen = false">
        <close-outlined />
      </a-button>
    </div>
    <div class="fullscreen-content">
      <MonacoEditor
        v-model:value="currentPuzzle.html"
        language="html"
        :height="fullscreenEditorHeight"
        theme="vs-dark"
      />
    </div>
  </div>

  <!-- 脚本编辑器全屏模式 -->
  <div v-if="scriptEditorFullscreen" class="fullscreen-editor">
    <div class="fullscreen-header">
      <div class="title">正在编辑 {{ currentPuzzle.title || '新题目' }} 脚本</div>
      <a-button class="close-btn" @click="scriptEditorFullscreen = false">
        <close-outlined />
      </a-button>
    </div>
    <div class="fullscreen-content">
      <MonacoEditor
        v-model:value="currentPuzzle.script"
        language="javascript"
        :height="fullscreenEditorHeight"
        theme="vs-dark"
        :isScriptEditor="true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, LockOutlined, SwapOutlined, CloseOutlined, FullscreenOutlined, PictureOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import {
  getPuzzleGroups,
  getPuzzleList,
  deletePuzzle,
  swapPuzzlePids,
  addPuzzle,
  editPuzzle,
  getAdditionalAnswers,
  addAdditionalAnswer,
  editAdditionalAnswer,
  deleteAdditionalAnswer,
  getTips,
  addTip,
  editTip,
  deleteTip
} from '@/api/puzzle';
import MonacoEditor from '@/components/MonacoEditor.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import ModuleUploader from '@/components/ModuleUploader.vue';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'pid',
    width: 80,
  },
  {
    title: '所属分区',
    key: 'pgid',
    width: 180,
  },
  {
    title: '标题',
    dataIndex: 'title',
    ellipsis: true,
    width: '30%',
  },
  {
    title: '备注',
    dataIndex: 'desc',
    ellipsis: true,
    width: '30%',
  },
  {
    title: '题目类型',
    key: 'answer_type',
    width: 120,
  },
  {
    title: '答案',
    dataIndex: 'answer',
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
const puzzleList = ref([]);
const puzzleGroups = ref([]);
const modalVisible = ref(false);
const swapModalVisible = ref(false);
const currentPuzzle = ref({
  pid: null,
  pgid: null,
  desc: '',
  type: 0,
  title: '',
  author: '',
  extend_data: '',
  extend_content: '',
  content: '',
  image: '',
  html: '',
  script: '',
  answer_type: 0,
  answer: '',
  check_answer_type: 0,
  check_answer_function: '',
  attempts_count: 20,
  analysis: '',
  dt_update: null,
  last_dt_update: null
});

// 自动保存状态
const autoSaveKey = 'puzzle_autosave';
const lastSavedTime = ref('');
const autoSaveTimer = ref(null);

// 编辑器状态
const uploaderVisible = ref(false);
const htmlEditorFullscreen = ref(false);
const scriptEditorFullscreen = ref(false);
const fullscreenEditorHeight = computed(() => {
  return window.innerHeight - 70; // 减去头部高度
});

// PID交换信息
const swapInfo = ref({
  pid1: null,
  pid2: null
});

// 附加答案状态
const additionalAnswerModalVisible = ref(false);
const additionalAnswerLoading = ref(false);
const additionalAnswers = ref([]);
const currentAdditionalAnswer = ref({
  aaid: null,
  pid: null,
  answer: '',
  message: '',
  extra: '',
  not_count: 0
});

// 计算属性：处理复选框的布尔值转换
const notCountChecked = computed({
  get: () => currentAdditionalAnswer.value.not_count === 1,
  set: (value) => {
    currentAdditionalAnswer.value.not_count = value ? 1 : 0;
  }
});

// 附加答案列定义
const additionalAnswerColumns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
  },
  {
    title: '答案',
    dataIndex: 'answer',
    ellipsis: true,
  },
  {
    title: '消息',
    dataIndex: 'message',
    ellipsis: true,
  },
  {
    title: '不计数',
    dataIndex: 'not_count',
    width: 100,
    customRender: ({ text }) => text === 1 ? '是' : ''
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
];

// 提示状态
const tipsModalVisible = ref(false);
const tipsLoading = ref(false);
const tips = ref([]);
const currentTip = ref({
  ptid: null,
  order: 0,
  pid: null,
  title: '',
  content: '',
  desc: '',
  point_cost: 0,
  unlock_delay: 0
});

// 提示列定义
const tipsColumns = [
  {
    title: '排序',
    dataIndex: 'order',
    width: 80,
  },
  {
    title: '标题',
    dataIndex: 'title',
    ellipsis: true,
  },
  {
    title: '消耗信用点',
    dataIndex: 'point_cost',
    width: 100,
  },
  {
    title: '解锁延迟',
    dataIndex: 'unlock_delay',
    width: 100,
  },
  {
    title: '备注',
    dataIndex: 'desc',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
];

// 上传模块对话框
const moduleUploaderVisible = ref(false);

// 获取题目列表
const fetchPuzzleList = async () => {
  loading.value = true;
  try {
    const result = await getPuzzleList();
    puzzleList.value = result.puzzle || [];
  } catch (error) {
    console.error('获取题目列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取题目分区列表
const fetchPuzzleGroups = async () => {
  try {
    const result = await getPuzzleGroups();
    puzzleGroups.value = result.puzzle_group || [];
  } catch (error) {
    console.error('获取题目分区列表失败:', error);
  }
};

// 获取分区名称
const getPuzzleGroupName = (pgid) => {
  const group = puzzleGroups.value.find(group => group.pgid === pgid);
  return group ? group.pg_name : '未知分区';
};

// 判断分区是否隐藏
const isPuzzleGroupHidden = (pgid) => {
  const group = puzzleGroups.value.find(group => group.pgid === pgid);
  return group ? group.is_hide === 1 : false;
};

// 获取题目类型名称
const getAnswerTypeName = (answerType) => {
  switch (answerType) {
    case 0: return '小题';
    case 1: return '分区Meta';
    case 2: return 'MetaMeta';
    case 3: return 'FinalMeta';
    case 4: return '不计分题目';
    default: return '未知类型';
  }
};

// 设置行样式
const getRowClassName = (record) => {
  switch (record.answer_type) {
    case 1: return 'puzzle-meta-row';      // 分区Meta - 淡绿色
    case 2:
    case 3: return 'puzzle-metameta-row';  // MetaMeta/FinalMeta - 浅橙色
    case 4: return 'puzzle-nonscored-row'; // 不计分题目 - 浅灰色
    default: return '';
  }
};

// 显示编辑模态框
const showEditModal = (record = null) => {
  // 先检查是否有自动保存的数据
  const savedData = localStorage.getItem(autoSaveKey);
  
  if (record) {
    // 编辑现有题目
    currentPuzzle.value = { 
      ...record,
      // 确保布尔值转换正确
      is_hide: record.is_hide === 1,
      // 保存当前更新时间作为最后更新时间
      last_dt_update: record.dt_update
    };
  } else {
    // 如果是新建题目，检查是否有自动保存的草稿
    if (savedData && !record) {
      Modal.confirm({
        title: '发现自动保存的草稿',
        content: '是否要恢复上次自动保存的内容？',
        okText: '恢复',
        cancelText: '不恢复',
        onOk: () => {
          try {
            const parsedData = JSON.parse(savedData);
            currentPuzzle.value = parsedData;
            message.success('已恢复自动保存的内容');
          } catch (error) {
            console.error('解析自动保存数据失败:', error);
            resetCurrentPuzzle();
          }
        },
        onCancel: () => {
          resetCurrentPuzzle();
          // 清除自动保存的数据
          localStorage.removeItem(autoSaveKey);
        }
      });
    } else {
      resetCurrentPuzzle();
    }
  }
  
  // 启动自动保存
  startAutoSave();
  
  modalVisible.value = true;
};

// 重置当前题目为默认值
const resetCurrentPuzzle = () => {
  currentPuzzle.value = {
    pid: null,
    pgid: null,
    desc: '',
    type: 0,
    title: '',
    author: '',
    extend_data: '',
    extend_content: '',
    content: '',
    image: '',
    html: '',
    script: '',
    answer_type: 0,
    answer: '',
    check_answer_type: 0,
    check_answer_function: '',
    attempts_count: 20,
    analysis: '',
    dt_update: null,
    last_dt_update: null
  };
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
    localStorage.setItem(autoSaveKey, JSON.stringify(currentPuzzle.value));
    const now = new Date();
    lastSavedTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    console.log('自动保存成功', lastSavedTime.value);
  } catch (error) {
    console.error('自动保存失败:', error);
  }
};

// 显示PID交换对话框
const showSwapModal = () => {
  swapInfo.value = {
    pid1: null,
    pid2: null
  };
  swapModalVisible.value = true;
};

// 保存题目
const handleSave = async (saveonly = false) => {
  try {
    const { 
      pid, pgid, title, author, answer, content,
      desc, type, extend_data, extend_content,
      image, html, script, answer_type,
      check_answer_type, check_answer_function,
      attempts_count, analysis, last_dt_update
    } = currentPuzzle.value;
    
    // 验证必填字段
    if (!title.trim()) {
      message.error('题目标题不能为空');
      return;
    }
    
    if (pgid === null) {
      message.error('请选择题目所属分区');
      return;
    }
    
    if (!answer.trim()) {
      message.error('答案不能为空');
      return;
    }
    
    // 构建请求数据
    const puzzleData = {
      pgid,
      desc,
      type,
      title,
      author,
      extend_data,
      extend_content,
      content,
      image,
      html,
      script,
      answer_type,
      answer,
      check_answer_type,
      check_answer_function,
      attempts_count,
      analysis
    };
    
    // 如果是编辑现有题目，添加pid和编辑冲突检测参数
    if (pid) {
      puzzleData.pid = pid;
      puzzleData.last_dt_update = last_dt_update;
    }
    
    if (pid) {      
      try {
        await editPuzzle(puzzleData);
        message.success('编辑题目成功');
        if (!saveonly) {
          modalVisible.value = false;
        }
        // 清除自动保存
        stopAutoSave();
        localStorage.removeItem(autoSaveKey);
        
        // 重新获取题目列表
        await fetchPuzzleList();
        
        // 更新表单内容和dt_last_update以保证编辑冲突检测正常
        const updatedPuzzle = puzzleList.value.find(puzzle => puzzle.pid === pid);
        if (updatedPuzzle) {
          // 更新当前表单中的时间戳信息，保持其他用户输入的数据不变
          currentPuzzle.value.dt_update = updatedPuzzle.dt_update;
          currentPuzzle.value.last_dt_update = updatedPuzzle.dt_update;
        }
      } catch (error) {
        // 检查是否为编辑冲突错误
        if (error.message && error.message.includes('编辑冲突')) {
          message.error('该题目已被其他人修改，请刷新后再试');
          // 可以选择自动刷新列表
          fetchPuzzleList();
        } else {
          console.error('保存题目失败:', error);
        }
      }
    } else {
      // 创建新题目
      await addPuzzle(puzzleData);
      message.success('新建题目成功');
      modalVisible.value = false;
      // 清除自动保存
      stopAutoSave();
      localStorage.removeItem(autoSaveKey);
      fetchPuzzleList();
    }
  } catch (error) {
    console.error('保存题目失败:', error);
  }
};

// 删除题目
const handleDelete = async (pid) => {
  try {
    await deletePuzzle(pid);
    message.success('删除题目成功');
    fetchPuzzleList();
  } catch (error) {
    console.error('删除题目失败:', error);
  }
};

// 交换PID
const handleSwapPids = async () => {
  const { pid1, pid2 } = swapInfo.value;
  
  if (!pid1 || !pid2) {
    message.warning('请选择两个题目进行交换');
    return;
  }
  
  if (pid1 === pid2) {
    message.warning('不能选择相同的题目进行交换');
    return;
  }
  
  try {
    await swapPuzzlePids(pid1, pid2);
    message.success('PID交换成功');
    swapModalVisible.value = false;
    fetchPuzzleList();
  } catch (error) {
    console.error('PID交换失败:', error);
  }
};

// 下拉菜单筛选方法
const filterOption = (input, option) => {
  if (!input || !option.value) return true;
  
  // 在列表中找到对应pid的题目
  const puzzle = puzzleList.value.find(p => p.pid === option.value);
  if (!puzzle) return false;
  
  // 构建完整的题目信息文本
  const puzzleInfo = `${puzzle.pid} / ${puzzle.title} / ${puzzle.answer}`;
  
  // 判断是否匹配输入
  return puzzleInfo.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 显示图片上传器
const showImageUploader = () => {
  uploaderVisible.value = true;
};

// 扩展HTML编辑器
const expandHtmlEditor = () => {
  htmlEditorFullscreen.value = true;
};

// 扩展脚本编辑器
const expandScriptEditor = () => {
  scriptEditorFullscreen.value = true;
};

// ===== 附加答案(里程碑)相关方法 =====

// 显示附加答案模态框
const showAdditionalAnswerModal = async () => {
  // 确保选中了有效的题目
  if (!currentPuzzle.value.pid) {
    message.error('请先保存题目');
    return;
  }
  
  // 初始化表单
  resetAdditionalAnswerForm();
  
  // 加载附加答案数据
  await fetchAdditionalAnswers();
  
  // 显示模态框
  additionalAnswerModalVisible.value = true;
};

// 获取附加答案列表
const fetchAdditionalAnswers = async () => {
  additionalAnswerLoading.value = true;
  try {
    const result = await getAdditionalAnswers(currentPuzzle.value.pid);
    additionalAnswers.value = result.additional_answer || [];
  } catch (error) {
    console.error('获取附加答案列表失败:', error);
  } finally {
    additionalAnswerLoading.value = false;
  }
};

// 编辑附加答案
const handleEditAdditionalAnswer = (record) => {
  currentAdditionalAnswer.value = { ...record };
};

// 提交附加答案
const handleAdditionalAnswerSubmit = async () => {
  const { aaid, pid, answer, message: answerMessage, extra, not_count } = currentAdditionalAnswer.value;
  
  // 验证表单
  if (!answer.trim()) {
    message.error('附加答案不能为空');
    return;
  }
  
  try {
    if (aaid) {
      // 编辑现有附加答案
      await editAdditionalAnswer(aaid, currentPuzzle.value.pid, answer, answerMessage, extra, not_count);
      message.success('编辑附加答案成功');
    } else {
      // 添加新附加答案
      await addAdditionalAnswer(currentPuzzle.value.pid, answer, answerMessage, extra, not_count);
      message.success('添加附加答案成功');
    }
    
    // 重载列表和重置表单
    await fetchAdditionalAnswers();
    resetAdditionalAnswerForm();
  } catch (error) {
    console.error('保存附加答案失败:', error);
  }
};

// 删除附加答案
const handleDeleteAdditionalAnswer = async (aaid) => {
  try {
    await deleteAdditionalAnswer(aaid);
    message.success('删除附加答案成功');
    await fetchAdditionalAnswers();
  } catch (error) {
    console.error('删除附加答案失败:', error);
  }
};

// 重置附加答案表单
const resetAdditionalAnswerForm = () => {
  currentAdditionalAnswer.value = {
    aaid: null,
    pid: currentPuzzle.value.pid,
    answer: '',
    message: '',
    extra: '',
    not_count: 0
  };
};

// ===== 提示相关方法 =====

// 显示提示模态框
const showTipsModal = async () => {
  // 确保选中了有效的题目
  if (!currentPuzzle.value.pid) {
    message.error('请先保存题目');
    return;
  }
  
  // 先加载提示数据
  await fetchTips();
  
  // 然后初始化表单（这样可以根据已有提示计算默认排序值）
  resetTipForm();
  
  // 显示模态框
  tipsModalVisible.value = true;
};

// 获取提示列表
const fetchTips = async () => {
  tipsLoading.value = true;
  try {
    const result = await getTips(currentPuzzle.value.pid);
    tips.value = result.tips || [];
  } catch (error) {
    console.error('获取提示列表失败:', error);
  } finally {
    tipsLoading.value = false;
  }
};

// 编辑提示
const handleEditTip = (record) => {
  currentTip.value = { ...record };
};

// 提交提示
const handleTipSubmit = async () => {
  const { ptid, order, title, content, desc, point_cost, unlock_delay } = currentTip.value;
  
  // 验证表单
  if (!title.trim()) {
    message.error('提示标题不能为空');
    return;
  }
  
  try {
    if (ptid) {
      // 编辑现有提示
      await editTip(ptid, order, currentPuzzle.value.pid, title, content, desc, point_cost, unlock_delay);
      message.success('编辑提示成功');
    } else {
      // 添加新提示
      await addTip(order, currentPuzzle.value.pid, title, content, desc, point_cost, unlock_delay);
      message.success('添加提示成功');
    }
    
    // 重载列表和重置表单
    await fetchTips();
    resetTipForm();
  } catch (error) {
    console.error('保存提示失败:', error);
  }
};

// 删除提示
const handleDeleteTip = async (ptid) => {
  try {
    await deleteTip(ptid);
    message.success('删除提示成功');
    await fetchTips();
  } catch (error) {
    console.error('删除提示失败:', error);
  }
};

// 重置提示表单
const resetTipForm = () => {
  // 计算默认排序值：当前已有提示的最大排序值+1，如果没有提示则为1
  let defaultOrder = 1;
  if (tips.value && tips.value.length > 0) {
    const maxOrder = Math.max(...tips.value.map(tip => tip.order || 0));
    defaultOrder = maxOrder + 1;
  }
  
  currentTip.value = {
    ptid: null,
    order: defaultOrder,
    pid: currentPuzzle.value.pid,
    title: '',
    content: '',
    desc: '',
    point_cost: 0,
    unlock_delay: 0
  };
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

// 显示模块上传对话框
const showModuleUploader = () => {
  moduleUploaderVisible.value = true;
};

// 处理模块上传完成
const handleModuleUploaded = (url) => {
  currentPuzzle.value.script = url;
  moduleUploaderVisible.value = false;
};

// 打开模块说明文档
const openModuleInstruction = () => {
  window.open('https://github.com/cipherpuzzles/ccxc-engine-puzzle-template', '_blank');
};

onMounted(() => {
  fetchPuzzleGroups();
  fetchPuzzleList();
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

.left-buttons {
  display: flex;
  gap: 8px;
}

.swap-pid-btn {
  background-color: #fa8c16;
  border-color: #fa8c16;
  color: #fff;
}

.swap-pid-btn:hover {
  background-color: #fa9d32;
  border-color: #fa9d32;
  color: #fff;
}

.swap-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.swap-icon {
  font-size: 20px;
  color: #1890ff;
}

/* 题目类型行样式 */
:deep(.puzzle-meta-row) {
  background-color: rgba(82, 196, 26, 0.1);
}

:deep(.puzzle-metameta-row) {
  background-color: rgba(250, 140, 22, 0.1);
}

:deep(.puzzle-nonscored-row) {
  background-color: rgba(191, 191, 191, 0.2);
}

/* 编辑器样式 */
.editor-container {
  position: relative;
  border: 1px solid #303030;
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

.form-upload-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
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

.form-action-buttons {
  margin: 20px 0;
  display: flex;
}

.additional-list-container {
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.additional-list-container h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.form-status-title {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
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