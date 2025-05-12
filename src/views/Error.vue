<script setup>
defineProps({
  title: {
    type: String,
    default: '错误'
  },
  subTitle: {
    type: String,
    default: '发生未知错误'
  },
  code: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'error'
  }
})
</script>

<template>
  <div class="error-page">
    <a-result
      :status="status"
      :title="title"
      :sub-title="subTitle + (code ? ` (错误代码：${code})` : '')"
    >
      <template #extra>
        <a-button type="primary" @click="$router.push('/')">
          返回首页
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style> 