<script setup>
import {
  HomeOutlined,
  DashboardOutlined,
  UserOutlined,
  LoginOutlined,
  NotificationOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  FlagOutlined,
  TeamOutlined,
  HistoryOutlined,
  MessageOutlined,
  BulbOutlined,
  SettingOutlined,
  AppstoreOutlined,
  BookOutlined,
  CodeOutlined,
  ClearOutlined,
  MacCommandOutlined
} from '@ant-design/icons-vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const handleMenuClick = ({ key }) => {
  router.push(key);
};
</script>

<template>
  <div class="logo">
    <img src="../assets/logo_ccbc.svg" alt="CCXC Logo" />
    <span class="logo-text">CCXC Admin</span>
  </div>
  <a-menu
    theme="dark"
    mode="inline"
    :selectedKeys="[route.path]"
    @click="handleMenuClick"
  >
    <a-sub-menu key="system">
      <template #title>
        <span>
          <home-outlined />
          <span>系统</span>
        </span>
      </template>
      <a-menu-item key="/userbackend">
        <dashboard-outlined />
        <span>概览</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/user">
        <user-outlined />
        <span>用户管理</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/loginlog">
        <login-outlined />
        <span>登录记录</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/announcement">
        <notification-outlined />
        <span>公告</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/article">
        <file-text-outlined />
        <span>站内文章</span>
      </a-menu-item>
    </a-sub-menu>

    <a-sub-menu key="competition">
      <template #title>
        <span>
          <flag-outlined />
          <span>比赛</span>
        </span>
      </template>
      <a-menu-item key="/userbackend/group">
        <team-outlined />
        <span>组队</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/answerlog">
        <history-outlined />
        <span>答案记录</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/message">
        <message-outlined />
        <span>站内信</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/oracle">
        <bulb-outlined />
        <span>人工提示</span>
      </a-menu-item>
    </a-sub-menu>

    <a-sub-menu key="puzzle">
      <template #title>
        <span>
          <file-search-outlined />
          <span>出题</span>
        </span>
      </template>
      <a-menu-item key="/userbackend/basicsetting">
        <setting-outlined />
        <span>基本设置</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/puzzlegroup">
        <appstore-outlined />
        <span>题目分区</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/puzzle">
        <book-outlined />
        <span>题目管理</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/puzzlearticle">
        <file-text-outlined />
        <span>题目文章</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/puzzlescript">
        <code-outlined />
        <span>题目脚本</span>
      </a-menu-item>
    </a-sub-menu>

    <a-sub-menu key="advanced">
      <template #title>
        <span>
          <mac-command-outlined />
          <span>高级</span>
        </span>
      </template>
      <a-menu-item key="/userbackend/cachepurge">
        <clear-outlined />
        <span>清理缓存</span>
      </a-menu-item>
      <a-menu-item key="/userbackend/systemsettings">
        <setting-outlined />
        <span>系统设置</span>
      </a-menu-item>
    </a-sub-menu>
  </a-menu>
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