<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const result = urlParams.get('result')
  
  if (result === 'ok') {
    const userInfo = {
      uid: urlParams.get('uid'),
      username: urlParams.get('username'),
      roleid: urlParams.get('roleid'),
      token: urlParams.get('token'),
      sk: urlParams.get('sk'),
      etc: urlParams.get('etc')
    }
    
    userStore.setUserInfo(userInfo)
    router.push('/userbackend')
  } else {
    const errorMessage = urlParams.get('message')
    const errorCode = urlParams.get('code')
    router.push({
      path: '/error',
      query: {
        title: 'SSO登录失败',
        message: errorMessage || '登录过程中发生错误',
        code: errorCode,
        status: 'error'
      }
    })
  }
})
</script>

<template>
  <div class="sso-login-loading">
    <a-spin tip="正在处理SSO登录..." />
  </div>
</template>

<style scoped>
.sso-login-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style> 