<template>
  <div class="home">
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

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 15vh;
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