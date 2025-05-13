<template>
  <div class="page-container">
    <h1>基本设置</h1>

    <a-spin :spinning="loading">
      <!-- 第一组设置项：数值设置 -->
      <div class="setting-section">
        <h2>数值设置</h2>
        <div class="form-content">
          <a-form :model="numericalData" layout="vertical">
            <a-row :gutter="24">
              <a-col :span="8">
                <a-form-item label="初始信用点">
                  <a-input-number 
                    v-model:value="numericalData.initial_power_point" 
                    :min="0" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="增加一倍尝试次数消耗信用点">
                  <a-input-number 
                    v-model:value="numericalData.add_attempts_count_cost" 
                    :min="0" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="提示功能解锁时间（分钟）">
                  <a-input-number 
                    v-model:value="numericalData.unlock_tip_function_after" 
                    :min="0" 
                    :step="0.1" 
                    :precision="1" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="24">
              <a-col :span="8">
                <a-form-item label="人工提示解锁最短时间（分钟）">
                  <a-input-number 
                    v-model:value="numericalData.manual_tip_reply_delay" 
                    :min="0" 
                    :step="0.1" 
                    :precision="1" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="默认人工提示消耗信用点">
                  <a-input-number 
                    v-model:value="numericalData.default_oracle_cost" 
                    :min="0" 
                    style="width: 100%" 
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </div>

      <!-- 第二组设置项：解锁设置 -->
      <div class="setting-section">
        <h2>解锁设置</h2>
        <div class="form-content">
          <a-form :model="numericalData" layout="vertical">
            <a-form-item label="初始解锁分区数量">
              <a-input-number 
                v-model:value="numericalData.initial_group_count" 
                :min="1" 
                :max="visibleGroupCount" 
              />
            </a-form-item>
            
            <!-- 分区解锁矩阵 -->
            <div class="matrix-container">
              <table class="unlock-matrix">
                <thead>
                  <tr>
                    <th>设置项 / 分区</th>
                    <th v-for="group in visibleGroups" :key="group.pgid">
                      {{ group.pgid }} / {{ group.pg_name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>分区解锁时同时打开的题目数量（做题宽度）</td>
                    <td v-for="(group, index) in visibleGroups" :key="`first_${group.pgid}`">
                      <a-input-number 
                        v-model:value="matrixData.first_unlock_each_group_count[index]" 
                        :min="0" 
                        size="small" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>解锁Meta所需的题目数量</td>
                    <td v-for="(group, index) in visibleGroups" :key="`meta_${group.pgid}`">
                      <a-input-number 
                        v-model:value="matrixData.unlock_meta_each_group_count[index]" 
                        :min="0" 
                        size="small" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>解锁下一分区所需的题目数量</td>
                    <td v-for="(group, index) in visibleGroups" :key="`next_${group.pgid}`">
                      <a-input-number 
                        v-model:value="matrixData.unlock_next_group_count[index]" 
                        :min="0" 
                        size="small" 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="form-actions">
              <a-button type="primary" @click="updateNumericalSettings" :loading="updating">
                更新数值
              </a-button>
            </div>
          </a-form>
        </div>
      </div>

      <!-- 警告信息 -->
      <a-alert
        type="warning"
        show-icon
        message="进行以下操作需管理员权限：修改信用点增速或使用解锁分区控制、解锁宽度时，会刷新全员存档，操作过程系统非常缓慢，请谨慎使用。"
        style="margin: 24px 0"
      />

      <!-- 第三组设置项：信用点增速 -->
      <div class="setting-section">
        <h2>信用点增速设置</h2>
        <div class="form-content">
          <a-form layout="inline">
            <a-form-item label="每分钟增加信用点数量">
              <a-input-number 
                v-model:value="powerIncreaseRate" 
                :min="0" 
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="updatePowerIncreaseRate" :loading="updatingPowerRate">
                更新
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <!-- 第四组设置项：自动解锁分区 -->
      <div class="setting-section">
        <h2>自动解锁分区设置</h2>
        <div class="form-content">
          <p>当前自动解锁分区：{{ numericalData.max_auto_unlock_group }}</p>
          <div class="form-actions">
            <a-space>
              <a-button type="primary" @click="resetAutoUnlock" :loading="updatingAutoUnlock">
                重置
              </a-button>
              <a-button 
                type="primary" 
                @click="updateAutoUnlock" 
                :loading="updatingAutoUnlock"
                :disabled="!canUnlockNextGroup"
              >
                解锁{{ nextUnlockGroup }}区
              </a-button>
            </a-space>
          </div>
        </div>
      </div>

      <!-- 第五组设置项：解锁宽度 -->
      <div class="setting-section">
        <h2>解锁宽度</h2>
        <div class="form-content">
          <p class="description-text">操作后将为所有已经解锁此分区的队伍，按顺序解锁一道未解锁的题目。即增加 1 做题宽度。</p>
          
          <div class="unlock-buttons">
            <a-space wrap :size="12">
              <a-button 
                v-for="group in visibleGroups" 
                :key="group.pgid"
                type="primary" 
                @click="unlockNextPuzzle(group.pgid)"
                :loading="unlockingPgid === group.pgid"
              >
                {{ group.pgid }} / {{ group.pg_name }}
              </a-button>
            </a-space>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getDynamicNumericalSet, updateDynamicNumericalSet, updatePowerIncreaseRate as updatePowerRate, unlockAutoGroup, unlockNextPuzzleForAll } from '@/api/setting';
import { getPuzzleGroups } from '@/api/puzzle';

// 数据加载状态
const loading = ref(true);
const updating = ref(false);
const updatingPowerRate = ref(false);
const updatingAutoUnlock = ref(false);
const unlockingPgid = ref(null);

// 基本数值设置
const numericalData = ref({
  initial_power_point: 0,
  add_attempts_count_cost: 0,
  unlock_tip_function_after: 0,
  manual_tip_reply_delay: 0,
  default_oracle_cost: 0,
  initial_group_count: 0,
  first_unlock_each_group_count: '',
  unlock_meta_each_group_count: '',
  unlock_next_group_count: '',
  power_increase_rate: 0,
  max_auto_unlock_group: 0
});

// 信用点增速
const powerIncreaseRate = ref(0);

// 题目分区数据
const puzzleGroups = ref([]);
const visibleGroups = computed(() => {
  return puzzleGroups.value.filter(group => group.is_hide === 0);
});
const visibleGroupCount = computed(() => visibleGroups.value.length);

// 解锁矩阵数据
const matrixData = ref({
  first_unlock_each_group_count: [],
  unlock_meta_each_group_count: [],
  unlock_next_group_count: []
});

// 自动解锁分区相关计算
const nextUnlockGroup = computed(() => {
  const current = numericalData.value.max_auto_unlock_group;
  if (current < 2) return 3;
  return Math.min(current + 1, visibleGroupCount.value - 1);
});

const canUnlockNextGroup = computed(() => {
  const current = numericalData.value.max_auto_unlock_group;
  return current < (visibleGroupCount.value - 1) && nextUnlockGroup.value <= (visibleGroupCount.value - 1);
});

// 初始化页面数据
const initData = async () => {
  loading.value = true;
  try {
    // 获取数值设置
    const numericalResult = await getDynamicNumericalSet();
    
    // 获取题目分区
    const groupResult = await getPuzzleGroups();
    
    // 设置数值数据
    numericalData.value = numericalResult.data;
    powerIncreaseRate.value = numericalResult.data.power_increase_rate;
    
    // 设置题目分区数据
    puzzleGroups.value = groupResult.puzzle_group;
    
    // 初始化矩阵数据
    initMatrixData();
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 初始化矩阵数据
const initMatrixData = () => {
  // 解析逗号分隔的字符串为数组
  const parseStringToArray = (str) => {
    if (!str) return [];
    return str.split(',').map(item => parseInt(item.trim(), 10));
  };
  
  const firstUnlockArray = parseStringToArray(numericalData.value.first_unlock_each_group_count);
  const unlockMetaArray = parseStringToArray(numericalData.value.unlock_meta_each_group_count);
  const unlockNextArray = parseStringToArray(numericalData.value.unlock_next_group_count);
  
  // 为可见的分区设置矩阵数据
  matrixData.value = {
    first_unlock_each_group_count: firstUnlockArray,
    unlock_meta_each_group_count: unlockMetaArray,
    unlock_next_group_count: unlockNextArray
  };
};

// 更新数值设置
const updateNumericalSettings = async () => {
  // 将矩阵数据转换为逗号分隔的字符串
  const arrayToString = (arr) => arr.join(',');
  
  // 准备提交的数据
  const submitData = {
    ...numericalData.value,
    first_unlock_each_group_count: arrayToString(matrixData.value.first_unlock_each_group_count),
    unlock_meta_each_group_count: arrayToString(matrixData.value.unlock_meta_each_group_count),
    unlock_next_group_count: arrayToString(matrixData.value.unlock_next_group_count)
  };
  
  updating.value = true;
  try {
    await updateDynamicNumericalSet(submitData);
    message.success('更新数值成功');
  } catch (error) {
    console.error('更新数值失败:', error);
  } finally {
    updating.value = false;
  }
};

// 更新信用点增速
const updatePowerIncreaseRate = async () => {
  updatingPowerRate.value = true;
  try {
    await updatePowerRate({
      power_increase_rate: powerIncreaseRate.value
    });
    message.success('更新信用点增速成功');
    // 更新本地数据
    numericalData.value.power_increase_rate = powerIncreaseRate.value;
  } catch (error) {
    console.error('更新信用点增速失败:', error);
  } finally {
    updatingPowerRate.value = false;
  }
};

// 重置自动解锁分区
const resetAutoUnlock = async () => {
  await updateAutoUnlockGroup(0);
};

// 解锁下一分区
const updateAutoUnlock = async () => {
  await updateAutoUnlockGroup(nextUnlockGroup.value);
};

// 更新自动解锁分区
const updateAutoUnlockGroup = async (value) => {
  updatingAutoUnlock.value = true;
  try {
    await unlockAutoGroup({
      max_auto_unlock_group: value
    });
    message.success('更新自动解锁分区成功');
    // 更新本地数据
    numericalData.value.max_auto_unlock_group = value;
  } catch (error) {
    console.error('更新自动解锁分区失败:', error);
  } finally {
    updatingAutoUnlock.value = false;
  }
};

// 为所有队伍解锁下一题
const unlockNextPuzzle = async (pgid) => {
  unlockingPgid.value = pgid;
  try {
    await unlockNextPuzzleForAll({ pgid });
    message.success(`成功为分区 ${pgid} 增加做题宽度`);
  } catch (error) {
    console.error('解锁操作失败:', error);
  } finally {
    unlockingPgid.value = null;
  }
};

// 页面加载时初始化数据
onMounted(() => {
  initData();
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
  margin-top: 16px;
}

.matrix-container {
  margin: 16px 0;
  overflow-x: auto;
}

.unlock-matrix {
  width: 100%;
  border-collapse: collapse;
}

.unlock-matrix th,
.unlock-matrix td {
  padding: 8px;
  text-align: center;
  border: 1px solid #e8e8e8;
}

.unlock-matrix th {
  background-color: #f5f5f5;
  font-weight: 500;
}

.unlock-matrix td:first-child {
  text-align: left;
  min-width: 250px;
  font-weight: 500;
}

.description-text {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.65);
}

.unlock-buttons {
  margin-top: 16px;
}
</style> 