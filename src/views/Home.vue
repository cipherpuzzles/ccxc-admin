<template>
  <div class="home">
    <!-- 用户信息区域 -->
    <div v-if="userStore.isLoggedIn()" class="user-info">
      <span class="username">{{ userStore.username }}</span>
      <button @click="logout" class="logout-btn">注销登录</button>
    </div>
    
    <div class="logo-container">
      <img src="../assets/logo_ccbc.svg" alt="CCXC Logo" />
    </div>
    <h1 class="title">CCXC Admin</h1>
    <footer class="footer">
      <span>Copyright ©2020-2025 密码菌 All rights reserved.</span>
      <span class="separator">Powered by CCXCEngine</span>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener" class="beian">京ICP备2021017804号-1</a>
    </footer>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import axios from 'axios'

const userStore = useUserStore()
const router = useRouter()

const logout = async () => {
  userStore.clearUserInfo()
  window.location.reload()
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 15vh;
  position: relative;
}

.user-info {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.username {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.logout-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background-color: #f6ffff;
}

.logout-btn:active {
  background-color: #e6f7ff;
}

.logo-container {
  width: 250px;
  height: 250px;
  background-color: #0F327D;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-container img {
  width: 70%;
  height: auto;
}

.title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 24px;
  margin-top: 24px;
}

.footer {
  position: fixed;
  bottom: 20px;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.separator {
  margin: 0 12px;
}

.beian {
  color: #666;
  text-decoration: none;
  transition: color 0.3s ease;
}

.beian:hover {
  color: #1890ff;
}
</style> 