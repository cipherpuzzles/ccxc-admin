<script setup>
import SideMenu from '../components/SideMenu.vue';
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider>
      <side-menu />
    </a-layout-sider>
    <a-layout>
      <a-layout-content style="margin: 24px 16px 0">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  height: 64px;
  background: #0F327D;
  border-radius: 12px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo img {
  width: auto;
  height: 60%;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-left: 12px;
}
</style> 